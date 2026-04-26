// pages/api/graph/token.ts
// API route para obter token do Microsoft Graph

import { NextApiRequest, NextApiResponse } from 'next';

interface TokenResponse {
  access_token?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TokenResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Configurações do Azure AD (devem estar no .env.local)
    const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
      console.error('Missing Microsoft Graph configuration');
      return res.status(500).json({ error: 'Microsoft Graph not configured' });
    }

    // Obter token usando Client Credentials Flow
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token request failed:', errorData);
      return res.status(500).json({ error: 'Failed to obtain access token' });
    }

    const tokenData = await tokenResponse.json();
    
    // Retornar apenas o token (não logar por segurança)
    res.status(200).json({ 
      access_token: tokenData.access_token 
    });

  } catch (error) {
    console.error('Error obtaining Graph token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 