import type { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '@querymedic/database';

export interface OrgMembershipContext {
  organizationId: string;
  role: Role;
}

declare module 'fastify' {
  interface FastifyRequest {
    orgContext?: OrgMembershipContext;
  }
}

export type RoleLevel = 'ADMIN' | 'ENGINEER' | 'VIEWER';

const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.ADMIN]: 3,
  [Role.ENGINEER]: 2,
  [Role.VIEWER]: 1,
};

/**
 * Validates that the requesting user has the minimum required role within the specified organization.
 */
export function hasRequiredRole(userRole: Role, minimumRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Creates a preHandler function enforcing role requirements.
 * Expects organizationId in request.params, request.query, or request.body.
 */
export function requireOrgRole(
  minimumRole: Role,
  getMembership: (userId: string, orgId: string) => Promise<{ role: Role } | null>
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as Record<string, string> | undefined;
    const body = request.body as Record<string, string> | undefined;
    const query = request.query as Record<string, string> | undefined;

    const orgId = params?.organizationId || params?.orgId || body?.organizationId || query?.organizationId;

    if (!orgId) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Organization identifier is required for this operation',
      });
    }

    const userId = request.user.userId;
    const membership = await getMembership(userId, orgId);

    if (!membership) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Organization not found or access denied',
      });
    }

    if (!hasRequiredRole(membership.role, minimumRole)) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: `Action requires ${minimumRole} permission. Current role: ${membership.role}`,
      });
    }

    request.orgContext = {
      organizationId: orgId,
      role: membership.role,
    };
  };
}
