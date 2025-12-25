import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ResumeDataSchema, UpdateResumeDataSchema } from '@app/shared';
import { resumeService } from '../services/resume-service.js';

export async function resumeRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // Get the master resume
  app.get('/resumes/master/data', {
    schema: {
      response: {
        200: ResumeDataSchema.nullable(),
      },
    },
  }, async () => {
    return await resumeService.getMasterResumeData();
  });

  // Create or update the master resume
  app.put('/resumes/master/data', {
    schema: {
      body: UpdateResumeDataSchema,
      response: {
        200: ResumeDataSchema,
      },
    },
  }, async (request) => {
    return await resumeService.upsertMasterResumeData(request.body);
  });
}

