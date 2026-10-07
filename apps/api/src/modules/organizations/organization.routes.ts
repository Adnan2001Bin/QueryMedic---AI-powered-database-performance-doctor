import type { FastifyPluginAsync } from 'fastify';
import { Role } from '@querymedic/database';
import type { PrismaClient } from '@querymedic/database';
import { requireOrgRole } from '../../plugins/rbac.guard.js';
import { OrganizationService } from './organization.service.js';
import { OrganizationController } from './organization.controller.js';

export function createOrganizationRoutes(prisma: PrismaClient): FastifyPluginAsync {
  const service = new OrganizationService(prisma);
  const controller = new OrganizationController(prisma);

  const getMembership = (userId: string, orgId: string) => service.getMembership(userId, orgId);

  return async (fastify) => {
    // All routes in this module require authentication
    fastify.addHook('preHandler', fastify.authenticate);

    // Organization CRUD
    fastify.post('/', controller.createOrganization);
    fastify.get('/', controller.listOrganizations);
    fastify.get(
      '/:organizationId',
      { preHandler: [requireOrgRole(Role.VIEWER, getMembership)] },
      controller.getOrganization
    );

    // Member Management
    fastify.post(
      '/:organizationId/members',
      { preHandler: [requireOrgRole(Role.ADMIN, getMembership)] },
      controller.addMember
    );
    fastify.get(
      '/:organizationId/members',
      { preHandler: [requireOrgRole(Role.VIEWER, getMembership)] },
      controller.listMembers
    );
  };
}
