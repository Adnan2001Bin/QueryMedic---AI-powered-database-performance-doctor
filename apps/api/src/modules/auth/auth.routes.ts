import type { FastifyPluginAsync } from 'fastify';
import type { PrismaClient } from '@querymedic/database';
import { AuthController } from './auth.controller.js';

export function createAuthRoutes(prisma: PrismaClient): FastifyPluginAsync {
  const controller = new AuthController(prisma);

  return async (fastify) => {
    fastify.post('/register', controller.register);
    fastify.post('/login', controller.login);
    fastify.get('/me', { preHandler: [fastify.authenticate] }, controller.getMe);
  };
}
