import { OAuth2Client } from 'google-auth-library';

const config = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_HOST}/oauth/callback`,
    scopes: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/calendar.calendarlist.readonly', 'https://www.googleapis.com/auth/calendar.events'],
    state: 'google'
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_HOST}/oauth/callback`,
    scopes: ['openid', 'profile', 'email', 'offline_access', 'https://graph.microsoft.com/User.Read', 'https://graph.microsoft.com/Calendars.ReadWrite'],
    state: 'microsoft'
  }
};

// Initialize Google OAuth2 client
let googleClient: OAuth2Client | null = null;
function getGoogleClient() {
  if (!googleClient) {
    googleClient = new OAuth2Client(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
  }
  return googleClient;
}

// Note: Microsoft Graph client is not currently used in the OAuth flow
// The OAuth flow uses direct HTTP requests to Microsoft's OAuth endpoints

// Generate OAuth2 URLs
export function getGoogleAuthUrl() {
  const client = getGoogleClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: config.google.scopes,
    prompt: 'consent',
    state: 'google',
    response_type: 'code',
  });
}

export function getMicrosoftAuthUrl() {
  const url = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  url.searchParams.append('client_id', config.microsoft.clientId);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('redirect_uri', config.microsoft.redirectUri);
  url.searchParams.append('response_mode', 'query');
  url.searchParams.append('scope', config.microsoft.scopes.join(' '));
  url.searchParams.append('state', 'microsoft');
  return url.toString();
}

// Exchange authorization code for tokens
export async function exchangeGoogleToken(code: string) {
  try {
    console.log('Google token exchange request:', {
      code_length: code.length,
      client_id: config.google.clientId ? 'SET' : 'NOT_SET',
      redirect_uri: config.google.redirectUri
    });

    const client = getGoogleClient();
    const { tokens } = await client.getToken(code);
    
    console.log('Google token exchange successful:', {
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token,
      has_id_token: !!tokens.id_token,
      expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : undefined
    });

    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : undefined,
      token_type: tokens.token_type,
      id_token: tokens.id_token
    };
  } catch (error) {
    console.error('Google token exchange failed:', error);
    throw error;
  }
}

export async function exchangeMicrosoftToken(code: string) {
  const url = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/token');
  
  // Log the request details (without sensitive data)
  console.log('Microsoft token exchange request:', {
    url: url.toString(),
    client_id: config.microsoft.clientId ? 'SET' : 'NOT_SET',
    redirect_uri: config.microsoft.redirectUri,
    code_length: code.length
  });

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: config.microsoft.clientId,
      client_secret: config.microsoft.clientSecret,
      code,
      redirect_uri: config.microsoft.redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Microsoft token exchange failed:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`Failed to exchange Microsoft token: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const tokenData = await response.json();
  console.log('Microsoft token exchange successful:', {
    has_access_token: !!tokenData.access_token,
    has_refresh_token: !!tokenData.refresh_token,
    expires_in: tokenData.expires_in,
    token_type: tokenData.token_type
  });

  return tokenData;
}

// Get user info from tokens
export async function getGoogleUserInfo(accessToken: string) {
  try {
    console.log('Getting Google user info...');
    
    const client = getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken: accessToken,
      audience: config.google.clientId
    });
    const payload = ticket.getPayload()!;
    
    console.log('Google user info retrieved:', {
      id: payload.sub,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name
    });

    return {
      id: payload.sub,
      email: payload.email!,
      firstName: payload.given_name!,
      lastName: payload.family_name!,
      picture: payload.picture
    };
  } catch (error) {
    console.error('Error getting Google user info:', error);
    throw error;
  }
}

export async function getMicrosoftUserInfo(accessToken: string) {
  try {
    console.log('Getting Microsoft user info...');
    
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Microsoft user info request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to get Microsoft user info: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Microsoft user info retrieved:', {
      id: data.id,
      email: data.mail || data.userPrincipalName,
      firstName: data.givenName,
      lastName: data.surname
    });

    return {
      id: data.id,
      email: data.mail || data.userPrincipalName,
      firstName: data.givenName,
      lastName: data.surname,
      picture: null
    };
  } catch (error) {
    console.error('Error getting Microsoft user info:', error);
    throw error;
  }
}

export async function revokeMicrosoftToken(accessToken: string, refreshToken?: string | null): Promise<void> {
  // Revoke access token
  const accessTokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.microsoft.clientId,
      client_secret: config.microsoft.clientSecret,
      token: accessToken,
    }),
  })

  if (!accessTokenResponse.ok) {
    const errorText = await accessTokenResponse.text()
    console.error('Failed to revoke Microsoft access token:', errorText)
    throw new Error(`Failed to revoke Microsoft access token: ${errorText}`)
  }

  // If refresh token exists, revoke it as well
  if (refreshToken) {
    const refreshTokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.microsoft.clientId,
        client_secret: config.microsoft.clientSecret,
        token: refreshToken,
      }),
    })

    if (!refreshTokenResponse.ok) {
      const errorText = await refreshTokenResponse.text()
      console.error('Failed to revoke Microsoft refresh token:', errorText)
      throw new Error(`Failed to revoke Microsoft refresh token: ${errorText}`)
    }
  }
}

export async function revokeGoogleToken(accessToken: string, refreshToken?: string | null): Promise<void> {
  // Revoke access token
  const accessTokenResponse = await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${accessToken}`, {
    method: 'GET',
  })

  if (!accessTokenResponse.ok) {
    const errorText = await accessTokenResponse.text()
    console.error('Failed to revoke Google access token:', errorText)
    throw new Error(`Failed to revoke Google access token: ${errorText}`)
  }

  // If refresh token exists, revoke it as well
  if (refreshToken) {
    const refreshTokenResponse = await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${refreshToken}`, {
      method: 'GET',
    })

    if (!refreshTokenResponse.ok) {
      const errorText = await refreshTokenResponse.text()
      console.error('Failed to revoke Google refresh token:', errorText)
      throw new Error(`Failed to revoke Google refresh token: ${errorText}`)
    }
  }
} 