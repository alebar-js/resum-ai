import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requiredEnv } from '../../../shared/env.js';
import { sendError } from '../../../shared/http.js';
import { getDb } from '../../../shared/db.js';
import { users } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { signUserJwt, setAuthCookie } from '../../../shared/auth.js';

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
};

type GoogleUserInfo = {
  sub?: string;
  id?: string;
  email?: string;
  name?: string;
  picture?: string;
};

async function fetchToken(code: string, redirectUri: string) {
  const clientId = requiredEnv('GOOGLE_CLIENT_ID');
  const clientSecret = requiredEnv('GOOGLE_CLIENT_SECRET');
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to exchange code: ${res.status} ${text}`);
  }
  return (await res.json()) as GoogleTokenResponse;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch user info: ${res.status} ${text}`);
  }
  return (await res.json()) as GoogleUserInfo;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed', code: 405 });
  }

  try {
    const code = typeof req.query.code === 'string' ? req.query.code : undefined;
    const state = typeof req.query.state === 'string' ? req.query.state : undefined;
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state', code: 400 });
    }

    const stateCookie = (req.cookies as Record<string, string> | undefined)?.oauth_state;
    if (!stateCookie || stateCookie !== state) {
      return res.status(400).json({ error: 'Invalid state', code: 400 });
    }

    const redirectUri = requiredEnv('GOOGLE_CALLBACK_URL');
    const tokenResponse = await fetchToken(code, redirectUri);
    const profile = await fetchGoogleUserInfo(tokenResponse.access_token);

    const googleId = profile.sub ?? profile.id;
    const email = profile.email;
    if (!googleId) return res.status(400).json({ error: 'Google profile missing id', code: 400 });
    if (!email) return res.status(400).json({ error: 'Google profile missing email', code: 400 });

    const name = profile.name ?? null;
    const picture = profile.picture ?? null;
    const now = new Date();

    const db = getDb();

    const [existingByGoogle] = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    let userRow = existingByGoogle;

    if (userRow) {
      const [updated] = await db
        .update(users)
        .set({
          email,
          name: name ?? userRow.name,
          picture: picture ?? userRow.picture,
          updatedAt: now,
        } as any)
        .where(eq(users.id, userRow.id))
        .returning();
      userRow = updated;
    } else {
      const [existingByEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingByEmail) {
        const [updated] = await db
          .update(users)
          .set({
            googleId,
            name: name ?? existingByEmail.name,
            picture: picture ?? existingByEmail.picture,
            updatedAt: now,
          } as any)
          .where(eq(users.id, existingByEmail.id))
          .returning();
        userRow = updated;
      } else {
        const [created] = await db
          .insert(users)
          .values({
            email,
            name,
            picture,
            googleId,
            createdAt: now,
            updatedAt: now,
          } as any)
          .returning();
        userRow = created;
      }
    }

    const token = await signUserJwt({
      id: userRow.id,
      email: userRow.email,
      name: userRow.name ?? null,
    });
    setAuthCookie(res, token);

    const redirectTo = process.env.AUTH_SUCCESS_REDIRECT ?? 'http://localhost:5173/';
    res.status(302).setHeader('Location', redirectTo).end();
  } catch (err) {
    return sendError(res, err);
  }
}

