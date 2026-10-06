import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '@querymedic/security';
import { Role } from '@querymedic/database';
import type { PrismaClient } from '@querymedic/database';

const RegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
  organizationName: z.string().min(2).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function createAuthRoutes(prisma: PrismaClient): FastifyPluginAsync {
  return async (fastify) => {
    // POST /api/auth/register
    fastify.post('/register', async (request, reply) => {
      const parseResult = RegisterSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid registration input',
          details: parseResult.error.errors,
        });
      }

      const { email, name, password, organizationName } = parseResult.data;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'User with this email already exists',
        });
      }

      const passwordHash = await hashPassword(password);
      const defaultOrgName = organizationName || `${name.split(' ')[0]}'s Workspace`;
      const slug = defaultOrgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now().toString(36)}`;

      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          memberships: {
            create: {
              role: Role.ADMIN,
              organization: {
                create: {
                  name: defaultOrgName,
                  slug,
                },
              },
            },
          },
        },
        include: {
          memberships: {
            include: {
              organization: true,
            },
          },
        },
      });

      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      return reply.status(201).send({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          organizations: user.memberships.map((m) => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            role: m.role,
          })),
        },
      });
    });

    // POST /api/auth/login
    fastify.post('/login', async (request, reply) => {
      const parseResult = LoginSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid credentials input',
          details: parseResult.error.errors,
        });
      }

      const { email, password } = parseResult.data;
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          memberships: {
            include: {
              organization: true,
            },
          },
        },
      });

      if (!user) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      return reply.send({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          organizations: user.memberships.map((m) => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            role: m.role,
          })),
        },
      });
    });

    // GET /api/auth/me
    fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.userId },
        include: {
          memberships: {
            include: {
              organization: true,
            },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found',
        });
      }

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          organizations: user.memberships.map((m) => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            role: m.role,
          })),
        },
      });
    });
  };
}
