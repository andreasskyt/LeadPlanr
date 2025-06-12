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
    let validTo: Date;

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
        const errorText = await response.text();
        const errorData = JSON.parse(errorText);
        
        // Check if the error is due to an invalid refresh token
        if (errorData.error === 'invalid_grant') {
          // Return a specific status code that indicates re-authentication is needed
          return new NextResponse(JSON.stringify({
            error: 'REAUTH_REQUIRED',
            provider: 'google',
            message: 'Refresh token is invalid. Please re-authenticate.'
          }), { status: 401 });
        }
        
        throw new Error(`Failed to refresh Google token: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      newAccessToken = data.access_token;
      newRefreshToken = data.refresh_token
        ? data.refresh_token
        : account.refresh_token;
      
      // Set valid_to based on expires_in (default to 1 hour if not provided)
      const expiresIn = data.expires_in || 3600;
      validTo = new Date(Date.now() + expiresIn * 1000);
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
          scope: 'https://graph.microsoft.com/Calendars.ReadWrite',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorData = JSON.parse(errorText);
        
        // Check if the error is due to an invalid refresh token
        if (errorData.error === 'invalid_grant') {
          // Return a specific status code that indicates re-authentication is needed
          return new NextResponse(JSON.stringify({
            error: 'REAUTH_REQUIRED',
            provider: 'microsoft',
            message: 'Refresh token is invalid. Please re-authenticate.'
          }), { status: 401 });
        }
        
        throw new Error(`Failed to refresh Microsoft token: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      newAccessToken = data.access_token;
      newRefreshToken = data.refresh_token
        ? data.refresh_token
        : account.refresh_token;
      
      // Set valid_to based on expires_in (default to 1 hour if not provided)
      const expiresIn = data.expires_in || 3600;
      validTo = new Date(Date.now() + expiresIn * 1000);
    } else {
      return new NextResponse('Unsupported provider', { status: 400 });
    }

    // Update the account with new tokens
    const updatedAccount = await calendarAccounts.update(account.id, {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      valid_from: new Date(),
      valid_to: validTo,
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error('Error refreshing calendar account token:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 