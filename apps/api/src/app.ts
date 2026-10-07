import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifySensible from '@fastify/sensible';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@querymedic/database';
import { authPlugin } from './plugins/auth.plugin.js';
import { healthRoutes } from './modules/health/health.routes.js';
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

  // Cross-Cutting Middleware
  await app.register(fastifyCors, {
    origin: true,
    credentials: true,
  });
  await app.register(fastifySensible);
  await app.register(authPlugin);

  // Modular Feature Routes
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(createAuthRoutes(opts.prisma), { prefix: '/api/auth' });
  await app.register(createOrganizationRoutes(opts.prisma), { prefix: '/api/organizations' });

  return app;
}
