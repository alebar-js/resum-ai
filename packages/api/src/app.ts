import Fastify, { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { 
  serializerCompiler, 
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { userRoutes } from './routes/users.js';
import { resumeRoutes } from './routes/resumes.js';
import { jobPostingRoutes } from './routes/job-postings.js';
import { refactorRoutes } from './routes/refactor.js';
import { ingestRoutes } from './routes/ingest.js';
import { skillGapRoutes } from './routes/skill-gap.js';
import { authPlugin } from './plugins/auth.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // CORS configuration
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Global error handler
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    app.log.error(error);
    
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: error.validation,
      });
    }

    return reply.status(500).send({
      error: 'Internal Server Error',
      message: error.message,
    });
  });

  // Graceful shutdown
  app.addHook('onClose', async () => {
    app.log.info('Server shutting down...');
  });

  // Auth (OAuth2 + JWT cookie)
  await app.register(authPlugin);

  // Register routes
  await app.register(userRoutes);
  await app.register(resumeRoutes);
  await app.register(jobPostingRoutes);
  await app.register(refactorRoutes);
  await app.register(ingestRoutes);
  await app.register(skillGapRoutes);

  return app;
}
