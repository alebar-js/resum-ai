import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, json } from '../shared/http.js';
import { withAuth } from '../shared/auth.js';

export default withAuth(async (req: VercelRequest & { user: any }, res: VercelResponse) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed', code: 405 });
  }
  return json(res, 200, req.user);
});

