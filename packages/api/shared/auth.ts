import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { sendError } from './http.js';

const secret = process.env.AUTH_JWT_SECRET;
if (!secret) throw new Error('Missing required env var: AUTH_JWT_SECRET');
const secretKey = new TextEncoder().encode(secret);

export type AuthUser = { id: string; email: string; name?: string | null };

export async function signUserJwt(user: AuthUser): Promise<string> {
  return new SignJWT(user as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function requireAuth(req: VercelRequest): Promise<AuthUser> {
  const token = (req.cookies as Record<string, string> | undefined)?.access_token;
  if (!token) throw new Error('Unauthorized');
  const { payload } = await jwtVerify(token, secretKey);
  return payload as AuthUser;
}

export function setAuthCookie(res: VercelResponse, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookie = [
    `access_token=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    isProd ? 'Secure' : '',
    'Max-Age=604800',
  ]
    .filter(Boolean)
    .join('; ');
  res.setHeader('Set-Cookie', cookie);
}

export function withAuth(
  handler: (req: VercelRequest & { user: AuthUser }, res: VercelResponse) => Promise<void> | void
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      const user = await requireAuth(req);
      // @ts-expect-error augment
      req.user = user;
      return handler(req as any, res);
    } catch (err) {
      return sendError(res, err, 401);
    }
  };
}

