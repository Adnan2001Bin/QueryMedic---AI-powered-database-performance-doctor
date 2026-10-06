import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Role } from '@querymedic/database';
import type { PrismaClient } from '@querymedic/database';
import { requireOrgRole } from '../../plugins/rbac.js';

const CreateOrgSchema = z.object({
  name: z.string().min(2),
});

const AddMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'ENGINEER', 'VIEWER']).default('VIEWER'),
});

export function createOrganizationRoutes(prisma: PrismaClient): FastifyPluginAsync {
  const getMembership = async (userId: string, organizationId: string) => {
    return prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: { role: true },
    });
  };

  return async (fastify) => {
    // All routes require authentication
    fastify.addHook('preHandler', fastify.authenticate);

    // POST /api/organizations (Create new org)
    fastify.post('/', async (request, reply) => {
      const parseResult = CreateOrgSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid organization input',
          details: parseResult.error.errors,
        });
      }

      const { name } = parseResult.data;
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now().toString(36)}`;

      const org = await prisma.organization.create({
        data: {
          name,
          slug,
          members: {
            create: {
              userId: request.user.userId,
              role: Role.ADMIN,
            },
          },
        },
      });

      return reply.status(201).send({
        organization: org,
        role: Role.ADMIN,
      });
    });

    // GET /api/organizations (List current user's orgs)
    fastify.get('/', async (request, reply) => {
      const memberships = await prisma.organizationMember.findMany({
        where: { userId: request.user.userId },
        include: {
          organization: {
            include: {
              _count: {
                select: {
                  members: true,
                  databaseConnections: true,
                },
              },
            },
          },
        },
      });

      return reply.send({
        organizations: memberships.map((m) => ({
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
          planTier: m.organization.planTier,
          role: m.role,
          memberCount: m.organization._count.members,
          databaseCount: m.organization._count.databaseConnections,
          createdAt: m.organization.createdAt,
        })),
      });
    });

    // GET /api/organizations/:organizationId (Get org details)
    fastify.get(
      '/:organizationId',
      {
        preHandler: [requireOrgRole(Role.VIEWER, getMembership)],
      },
      async (request, reply) => {
        const { organizationId } = request.params as { organizationId: string };
        const org = await prisma.organization.findUnique({
          where: { id: organizationId },
          include: {
            _count: {
              select: {
                members: true,
                databaseConnections: true,
              },
            },
          },
        });

        if (!org) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Organization not found',
          });
        }

        return reply.send({
          organization: org,
          userRole: request.orgContext?.role,
        });
      }
    );

    // POST /api/organizations/:organizationId/members (Add/invite member, requires ADMIN)
    fastify.post(
      '/:organizationId/members',
      {
        preHandler: [requireOrgRole(Role.ADMIN, getMembership)],
      },
      async (request, reply) => {
        const { organizationId } = request.params as { organizationId: string };
        const parseResult = AddMemberSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Invalid member input',
            details: parseResult.error.errors,
          });
        }

        const { email, role } = parseResult.data;
        const targetUser = await prisma.user.findUnique({ where: { email } });
        if (!targetUser) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: `User with email ${email} not found. They must register first.`,
          });
        }

        const existingMember = await prisma.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId,
              userId: targetUser.id,
            },
          },
        });

        if (existingMember) {
          return reply.status(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: 'User is already a member of this organization',
          });
        }

        const newMember = await prisma.organizationMember.create({
          data: {
            organizationId,
            userId: targetUser.id,
            role: role as Role,
          },
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        });

        return reply.status(201).send({ member: newMember });
      }
    );

    // GET /api/organizations/:organizationId/members (List members)
    fastify.get(
      '/:organizationId/members',
      {
        preHandler: [requireOrgRole(Role.VIEWER, getMembership)],
      },
      async (request, reply) => {
        const { organizationId } = request.params as { organizationId: string };
        const members = await prisma.organizationMember.findMany({
          where: { organizationId },
          include: {
            user: {
              select: { id: true, email: true, name: true, createdAt: true },
            },
          },
        });

        return reply.send({
          members: members.map((m) => ({
            id: m.id,
            userId: m.userId,
            email: m.user.email,
            name: m.user.name,
            role: m.role,
            joinedAt: m.createdAt,
          })),
        });
      }
    );
  };
}
