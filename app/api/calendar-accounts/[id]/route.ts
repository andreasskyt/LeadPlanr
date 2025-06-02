import { NextResponse } from 'next/server';
import { calendarAccounts } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { revokeGoogleToken, revokeMicrosoftToken } from '@/lib/oauth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Delete request received for account:', params.id);
    
    const token = cookies().get('token')?.value;
    if (!token) {
      console.log('No token found in cookies');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('Invalid token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('User authenticated:', { userId: decoded.userId });

    // Get the account to verify ownership and get the access token
    const account = await calendarAccounts.getById(params.id);
    console.log('Found account:', account ? { 
      id: account.id, 
      provider: account.provider,
      userId: account.user_id,
      hasAccessToken: !!account.access_token,
      hasRefreshToken: !!account.refresh_token
    } : null);
    
    if (!account) {
      console.log('Account not found');
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Verify the account belongs to the user
    if (Number(account.user_id) !== Number(decoded.userId)) {
      console.log('Account ownership mismatch:', { 
        accountUserId: account.user_id, 
        tokenUserId: decoded.userId 
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Revoke the access token with the provider
    let revokeError = null;
    try {
      console.log('Attempting to revoke tokens for provider:', account.provider);
      if (account.provider === 'google') {
        console.log('Revoking Google tokens:', {
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token
        });
        await revokeGoogleToken(account.access_token, account.refresh_token);
      } else if (account.provider === 'microsoft') {
        console.log('Revoking Microsoft tokens:', {
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token
        });
        await revokeMicrosoftToken(account.access_token, account.refresh_token);
      }
      console.log('Tokens revoked successfully');
    } catch (error) {
      console.error('Failed to revoke tokens:', error);
      revokeError = error;
    }

    // Always clear sensitive fields and set calendar_access to false
    console.log('Disconnecting account (clearing tokens and disabling access)');
    await calendarAccounts.update(params.id, {
      access_token: null,
      refresh_token: null,
      valid_from: undefined,
      valid_to: undefined,
      calendar_access: false,
    });
    console.log('Account disconnected successfully');

    return NextResponse.json({ 
      success: true,
      message: revokeError
        ? 'Account disconnected, but token revocation failed. You may need to re-authenticate to add this calendar again.'
        : 'Account disconnected successfully. You can reconnect this calendar later.'
    });
  } catch (error) {
    console.error('Error deleting calendar account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 