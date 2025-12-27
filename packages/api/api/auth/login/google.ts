import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { requiredEnv } from '../../../shared/env.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed', code: 405 });
  }

  const clientId = requiredEnv('GOOGLE_CLIENT_ID');
  const callbackUrl = requiredEnv('GOOGLE_CALLBACK_URL');

  const state = randomUUID();
  const isProd = process.env.NODE_ENV === 'production';
  const stateCookie = [
    `oauth_state=${state}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    isProd ? 'Secure' : '',
    'Max-Age=600',
  ]
    .filter(Boolean)
    .join('; ');
  res.setHeader('Set-Cookie', stateCookie);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.status(302).setHeader('Location', url).end();
}

