import type { FastifyRequest, FastifyReply } from 'fastify';

export async function getHealthStatus(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'querymedic-api',
    uptimeSec: Math.floor(process.uptime()),
  });
}
