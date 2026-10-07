import type { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '@querymedic/database';
import type { PrismaClient } from '@querymedic/database';
import { CreateOrgSchema, AddMemberSchema } from './organization.schemas.js';

export class OrganizationController {
  constructor(private readonly prisma: PrismaClient) {}

  createOrganization = async (request: FastifyRequest, reply: FastifyReply) => {
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
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${Date.now().toString(36)}`;

    const org = await this.prisma.organization.create({
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
  };

  listOrganizations = async (request: FastifyRequest, reply: FastifyReply) => {
    const memberships = await this.prisma.organizationMember.findMany({
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
  };

  getOrganization = async (request: FastifyRequest, reply: FastifyReply) => {
    const { organizationId } = request.params as { organizationId: string };
    const org = await this.prisma.organization.findUnique({
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
  };

  addMember = async (request: FastifyRequest, reply: FastifyReply) => {
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
    const targetUser = await this.prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `User with email ${email} not found. They must register first.`,
      });
    }

    const existingMember = await this.prisma.organizationMember.findUnique({
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

    const newMember = await this.prisma.organizationMember.create({
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
  };

  listMembers = async (request: FastifyRequest, reply: FastifyReply) => {
    const { organizationId } = request.params as { organizationId: string };
    const members = await this.prisma.organizationMember.findMany({
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
  };
}
