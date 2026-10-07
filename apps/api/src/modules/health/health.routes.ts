import type { FastifyPluginAsync } from 'fastify';
import { getHealthStatus } from './health.controller.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', getHealthStatus);
};
