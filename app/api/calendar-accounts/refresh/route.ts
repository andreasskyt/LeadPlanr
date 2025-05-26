import { NextResponse } from 'next/server';
import { calendarAccounts } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { accountId } = await request.json();
    if (!accountId) {
      return new NextResponse('Account ID is required', { status: 400 });
    }

    const account = await calendarAccounts.getById(accountId);
    if (!account) {
      return new NextResponse('Account not found', { status: 404 });
    }

    if (account.user_id !== decoded.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let newAccessToken: string;
    let newRefreshToken: string | null = null;

    if (account.provider.toLowerCase() === 'google') {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: account.refresh_token!,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh Google token');
      }

      const data = await response.json();
      newAccessToken = data.access_token;
      newRefreshToken = data.refresh_token
        ? encrypt(data.refresh_token)
        : account.refresh_token;
    } else if (account.provider.toLowerCase() === 'microsoft') {
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          refresh_token: account.refresh_token!,
          grant_type: 'refresh_token',
          scope: 'https://graph.microsoft.com/Calendars.Read',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh Microsoft token');
      }

      const data = await response.json();
      newAccessToken = data.access_token;
      newRefreshToken = data.refresh_token
        ? encrypt(data.refresh_token)
        : account.refresh_token;
    } else {
      return new NextResponse('Unsupported provider', { status: 400 });
    }

    // Update the account with new tokens
    const updatedAccount = await calendarAccounts.update(account.id, {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      valid_from: new Date(),
      valid_to: null,
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error('Error refreshing calendar account token:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 