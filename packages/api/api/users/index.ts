import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CreateUserSchema } from '@app/shared';
import { userService } from '../../src/services/user-service.js';
import { applyCors, json, sendError } from '../../shared/http.js';
import { readJsonBody, validateBody } from '../../shared/validate.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  try {
    if (req.method === 'GET') {
      const users = await userService.listUsers();
      return json(res, 200, users);
    }

    if (req.method === 'POST') {
      const body = validateBody(CreateUserSchema, readJsonBody(req));
      const user = await userService.createUser(body);
      return json(res, 201, user);
    }

    return res.status(405).json({ error: 'Method Not Allowed', code: 405 });
  } catch (err) {
    return sendError(res, err);
  }
}

