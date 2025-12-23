import Fastify from 'fastify';
import { 
  serializerCompiler, 
  validatorCompiler,
  jsonSchemaTransform 
} from 'fastify-type-provider-zod';
import { userRoutes } from './routes/users.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register routes
  await app.register(userRoutes);

  return app;
}

