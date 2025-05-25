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
    try {
      console.log('Attempting to revoke tokens for provider:', account.provider);
      if (account.provider === 'google') {
        console.log('Revoking Google tokens:', {
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token
        });
        await revokeGoogleToken(account.access_token, account.refresh_token);
      } else if (account.provider === 'microsoft') {
        await revokeMicrosoftToken(account.access_token, account.refresh_token);
      }
      console.log('Tokens revoked successfully');
    } catch (error) {
      console.error('Failed to revoke tokens:', error);
      // If token revocation fails, we should still delete the account
      // but we need to make sure the user knows they need to re-authenticate
      await calendarAccounts.delete(params.id);
      return NextResponse.json({ 
        success: true,
        message: 'Account deleted but token revocation failed. You will need to re-authenticate to add this calendar again.'
      });
    }

    // Delete the account
    console.log('Deleting account from database');
    await calendarAccounts.delete(params.id);
    console.log('Account deleted successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Account deleted successfully. You will need to re-authenticate to add this calendar again.'
    });
  } catch (error) {
    console.error('Error deleting calendar account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 