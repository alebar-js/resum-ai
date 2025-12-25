import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ErrorResponseSchema, JobPostingDataSchema, CreateJobPostingDataSchema, UpdateJobPostingDataSchema } from '@app/shared';
import { jobPostingService } from '../services/job-posting-service.js';
import { z } from 'zod';

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function jobPostingRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // List all job postings
  app.get('/job-postings', {
    schema: {
      response: {
        200: z.array(JobPostingDataSchema),
      },
    },
  }, async () => {
    return await jobPostingService.getJobPostingsData();
  });

  // Get a specific job posting by ID
  app.get('/job-postings/:id', {
    schema: {
      params: ParamsSchema,
      response: {
        200: JobPostingDataSchema,
        404: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const jobPosting = await jobPostingService.getJobPostingDataById(request.params.id);
    if (!jobPosting) {
      return reply.status(404).send({ error: 'Job posting not found' });
    }
    return jobPosting;
  });

  // Create a new job posting
  app.post('/job-postings', {
    schema: {
      body: CreateJobPostingDataSchema,
      response: {
        201: JobPostingDataSchema,
      },
    },
  }, async (request, reply) => {
    const jobPosting = await jobPostingService.createJobPostingData(request.body);
    return reply.status(201).send(jobPosting);
  });

  // Update a job posting
  app.patch('/job-postings/:id', {
    schema: {
      params: ParamsSchema,
      body: UpdateJobPostingDataSchema,
      response: {
        200: JobPostingDataSchema,
        404: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const jobPosting = await jobPostingService.updateJobPostingData(request.params.id, request.body);
    if (!jobPosting) {
      return reply.status(404).send({ error: 'Job posting not found' });
    }
    return jobPosting;
  });

  // Delete a job posting
  app.delete('/job-postings/:id', {
    schema: {
      params: ParamsSchema,
      response: {
        204: z.null(),
        404: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const deleted = await jobPostingService.deleteJobPosting(request.params.id);
    if (!deleted) {
      return reply.status(404).send({ error: 'Job posting not found' });
    }
    return reply.status(204).send();
  });
}

