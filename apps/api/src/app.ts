import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifySensible from '@fastify/sensible';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@querymedic/database';
import { authPlugin } from './plugins/auth.js';
import { createAuthRoutes } from './modules/auth/auth.routes.js';
import { createOrganizationRoutes } from './modules/organizations/organization.routes.js';
import type { AppQueues } from './queues/index.js';

export interface BuildAppOptions {
  prisma: PrismaClient;
  queues?: AppQueues;
  jwtSecret?: string;
}

export async function buildApp(opts: BuildAppOptions): Promise<FastifyInstance> {
  const app = fastify({
    logger: process.env.NODE_ENV === 'test' ? false : true,
  });

  await app.register(fastifyCors, {
    origin: true,
    credentials: true,
  });

  await app.register(fastifySensible);

  // Authentication Plugin
  await app.register(authPlugin);

  // Health Check
  app.get('/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'querymedic-api',
      uptimeSec: Math.floor(process.uptime()),
    };
  });

  // API Modules
  await app.register(createAuthRoutes(opts.prisma), { prefix: '/api/auth' });
  await app.register(createOrganizationRoutes(opts.prisma), { prefix: '/api/organizations' });

  return app;
}
