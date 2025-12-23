import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { CreateUserSchema, UserSchema } from '@app/shared';
import { userService } from '../services/user-service.js';
import { z } from 'zod';

export async function userRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post('/users', {
    schema: {
      body: CreateUserSchema,
      response: {
        201: UserSchema,
      },
    },
  }, async (request, reply) => {
    const user = await userService.createUser(request.body);
    return reply.status(201).send(user);
  });

  app.get('/users', {
    schema: {
      response: {
        200: z.array(UserSchema),
      },
    },
  }, async () => {
    return await userService.listUsers();
  });
}

