import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UpdateJobPostingDataSchema } from '@app/shared';
import { jobPostingService } from '../../../src/services/job-posting-service.js';
import { applyCors, json, sendError } from '../../../shared/http.js';
import { validateBody, readJsonBody } from '../../../shared/validate.js';
import { withAuth } from '../../../shared/auth.js';
import { z } from 'zod';

const ParamsSchema = z.object({ id: z.string().uuid() });

export default withAuth(async (req: VercelRequest & { user: { id: string } }, res: VercelResponse) => {
  if (applyCors(req, res)) return;

  try {
    const parsedParams = ParamsSchema.safeParse(req.query);
    if (!parsedParams.success) {
      return res.status(400).json({ error: 'Invalid id', code: 400 });
    }
    const { id } = parsedParams.data;

    if (req.method === 'GET') {
      const jobPosting = await jobPostingService.getJobPostingDataById(id, req.user.id);
      if (!jobPosting) return res.status(404).json({ error: 'Job posting not found', code: 404 });
      return json(res, 200, jobPosting);
    }

    if (req.method === 'PATCH') {
      const body = validateBody(UpdateJobPostingDataSchema, readJsonBody(req));
      const updated = await jobPostingService.updateJobPostingData(id, body, req.user.id);
      if (!updated) return res.status(404).json({ error: 'Job posting not found', code: 404 });
      return json(res, 200, updated);
    }

    if (req.method === 'DELETE') {
      const deleted = await jobPostingService.deleteJobPosting(id, req.user.id);
      if (!deleted) return res.status(404).json({ error: 'Job posting not found', code: 404 });
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method Not Allowed', code: 405 });
  } catch (err) {
    return sendError(res, err);
  }
});

