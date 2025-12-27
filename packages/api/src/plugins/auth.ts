import fp from 'fastify-plugin';
import oauthPlugin from '@fastify/oauth2';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

type GoogleUserInfo = {
  id?: string; // legacy field (some endpoints)
  sub?: string; // OIDC field
  email?: string;
  name?: string;
  picture?: string;
};

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    googleOAuth2: {
      getAccessTokenFromAuthorizationCodeFlow: (request: FastifyRequest) => Promise<{ token: { access_token: string } }>;
    };
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      email: string;
      name?: string | null;
    };
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Failed to fetch Google userinfo (${res.status}): ${body}`);
  }

  return (await res.json()) as GoogleUserInfo;
}

export const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const isProd = process.env.NODE_ENV === 'production';

  // Cookies (needed for setCookie / reading access_token)
  await fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET, // optional; enables signed cookies if desired later
  });

  // JWT (we'll store the JWT in the httpOnly "access_token" cookie)
  await fastify.register(jwt, {
    secret: requiredEnv('AUTH_JWT_SECRET'),
    cookie: {
      cookieName: 'access_token',
      signed: false,
    },
  });

  // Global decorator used by protected routes
  // - Reads JWT from the `access_token` cookie
  // - Verifies it
  // - Attaches decoded payload to `request.user`
  fastify.decorate('authenticate', async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const token = request.cookies?.access_token;
      if (!token) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const decoded = fastify.jwt.verify<import('@fastify/jwt').FastifyJWT['user']>(token);
      request.user = decoded;
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // Session check endpoint for the frontend
  fastify.get('/api/me', { onRequest: [fastify.authenticate] }, async (request) => {
    return request.user;
  });

  // Google OAuth2
  await fastify.register(oauthPlugin, {
    name: 'googleOAuth2',
    scope: ['profile', 'email', 'openid'],
    // Ensure the state cookie is sent back to /auth/callback/google (default cookie path would be /auth/login/*)
    cookie: {
      path: '/',
      secure: isProd,
      sameSite: 'lax',
      httpOnly: true,
    },
    credentials: {
      client: {
        id: requiredEnv('GOOGLE_CLIENT_ID'),
        secret: requiredEnv('GOOGLE_CLIENT_SECRET'),
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: '/auth/login/google',
    callbackUri: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/auth/callback/google',
  });

  // OAuth callback: exchange code -> get profile -> upsert user -> set JWT cookie
  fastify.get('/auth/callback/google', async function (request: FastifyRequest, reply: FastifyReply) {
    const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
    const profile = await fetchGoogleUserInfo(token.access_token);

    const googleId = profile.sub ?? profile.id;
    const email = profile.email;
    if (!googleId) return reply.code(400).send({ error: 'Google profile missing id' });
    if (!email) return reply.code(400).send({ error: 'Google profile missing email' });

    const name = profile.name ?? null;
    const picture = profile.picture ?? null;
    const now = new Date();

    // 1) If already linked by googleId, update basic fields.
    const [existingByGoogle] = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    let userRow = existingByGoogle;

    if (userRow) {
      const [updated] = await db
        .update(users)
        .set({
          email, // keep in sync
          name: name ?? userRow.name,
          picture: picture ?? userRow.picture,
          updatedAt: now,
        })
        .where(eq(users.id, userRow.id))
        .returning();
      userRow = updated;
    } else {
      // 2) Otherwise, try to link by email.
      const [existingByEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingByEmail) {
        const [updated] = await db
          .update(users)
          .set({
            googleId,
            name: name ?? existingByEmail.name,
            picture: picture ?? existingByEmail.picture,
            updatedAt: now,
          })
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
          })
          .returning();
        userRow = created;
      }
    }

    const jwtToken = await reply.jwtSign({
      id: userRow.id,
      email: userRow.email,
      name: userRow.name ?? null,
    });

    reply.setCookie('access_token', jwtToken, {
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
    });

    // Where to send the user after login
    const redirectTo = process.env.AUTH_SUCCESS_REDIRECT ?? 'http://localhost:5173/';
    return reply.redirect(redirectTo);
  });
});


