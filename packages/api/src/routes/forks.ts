import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { JobForkSchema, CreateJobForkSchema, UpdateJobForkSchema, ErrorResponseSchema } from '@app/shared';
import { forkService } from '../services/fork-service.js';
import { z } from 'zod';

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function forkRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // List all job forks
  app.get('/forks', {
    schema: {
      response: {
        200: z.array(JobForkSchema),
      },
    },
  }, async () => {
    return await forkService.getForks();
  });

  // Get a specific fork by ID
  app.get('/forks/:id', {
    schema: {
      params: ParamsSchema,
      response: {
        200: JobForkSchema,
        404: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const fork = await forkService.getForkById(request.params.id);
    if (!fork) {
      return reply.status(404).send({ error: 'Fork not found' });
    }
    return fork;
  });

  // Create a new fork
  app.post('/forks', {
    schema: {
      body: CreateJobForkSchema,
      response: {
        201: JobForkSchema,
      },
    },
  }, async (request, reply) => {
    const fork = await forkService.createFork(request.body);
    return reply.status(201).send(fork);
  });

  // Update a fork
  app.patch('/forks/:id', {
    schema: {
      params: ParamsSchema,
      body: UpdateJobForkSchema,
      response: {
        200: JobForkSchema,
        404: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const fork = await forkService.updateFork(request.params.id, request.body);
    if (!fork) {
      return reply.status(404).send({ error: 'Fork not found' });
    }
    return fork;
  });

  // Delete a fork
  app.delete('/forks/:id', {
    schema: {
      params: ParamsSchema,
      response: {
        204: z.null(),
        404: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const deleted = await forkService.deleteFork(request.params.id);
    if (!deleted) {
      return reply.status(404).send({ error: 'Fork not found' });
    }
    return reply.status(204).send();
  });
}
