import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ResumeSchema, UpdateResumeSchema } from '@app/shared';
import { resumeService } from '../services/resume-service.js';

export async function resumeRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // Get the master resume
  app.get('/resumes/master', {
    schema: {
      response: {
        200: ResumeSchema.nullable(),
      },
    },
  }, async () => {
    return await resumeService.getMasterResume();
  });

  // Create or update the master resume
  app.put('/resumes/master', {
    schema: {
      body: UpdateResumeSchema,
      response: {
        200: ResumeSchema,
      },
    },
  }, async (request) => {
    return await resumeService.upsertMasterResume(request.body);
  });
}

