import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fp from 'fastify-plugin';

export interface UserTokenPayload {
  userId: string;
  email: string;
  name: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: UserTokenPayload;
    user: UserTokenPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const authPluginImpl: FastifyPluginAsync = async (fastify) => {
  const jwtSecret = process.env.JWT_SECRET || 'querymedic-dev-jwt-super-secret-key-32chars';

  await fastify.register(fastifyJwt, {
    secret: jwtSecret,
    sign: {
      expiresIn: '7d',
    },
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Valid authentication token is required',
      });
    }
  });
};

export const authPlugin = fp(authPluginImpl, {
  name: 'querymedic-auth',
});
