import type { PrismaClient } from '@querymedic/database';
import { Role } from '@querymedic/database';

export function createMockPrisma(): PrismaClient {
  const users: Array<any> = [];
  const orgs: Array<any> = [];
  const memberships: Array<any> = [];

  const mock = {
    user: {
      findUnique: async ({ where }: any) => {
        if (where.email) {
          const user = users.find((u) => u.email === where.email);
          if (!user) return null;
          return {
            ...user,
            memberships: memberships
              .filter((m) => m.userId === user.id)
              .map((m) => ({
                ...m,
                organization: orgs.find((o) => o.id === m.organizationId),
              })),
          };
        }
        if (where.id) {
          const user = users.find((u) => u.id === where.id);
          if (!user) return null;
          return {
            ...user,
            memberships: memberships
              .filter((m) => m.userId === user.id)
              .map((m) => ({
                ...m,
                organization: orgs.find((o) => o.id === m.organizationId),
              })),
          };
        }
        return null;
      },
      create: async ({ data }: any) => {
        const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const newUser = {
          id: userId,
          email: data.email,
          name: data.name,
          passwordHash: data.passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        users.push(newUser);

        if (data.memberships?.create) {
          const mData = data.memberships.create;
          const orgId = `org-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const newOrg = {
            id: orgId,
            name: mData.organization.create.name,
            slug: mData.organization.create.slug,
            planTier: 'developer',
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: { members: 1, databaseConnections: 0 },
          };
          orgs.push(newOrg);

          const newMembership = {
            id: `mem-${Date.now()}`,
            organizationId: orgId,
            userId,
            role: mData.role || Role.ADMIN,
            createdAt: new Date(),
          };
          memberships.push(newMembership);
        }

        return mock.user.findUnique({ where: { id: userId } });
      },
    },
    organization: {
      create: async ({ data }: any) => {
        const orgId = `org-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const newOrg = {
          id: orgId,
          name: data.name,
          slug: data.slug,
          planTier: 'developer',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { members: 1, databaseConnections: 0 },
        };
        orgs.push(newOrg);

        if (data.members?.create) {
          const mData = data.members.create;
          memberships.push({
            id: `mem-${Date.now()}`,
            organizationId: orgId,
            userId: mData.userId,
            role: mData.role || Role.ADMIN,
            createdAt: new Date(),
          });
        }

        return newOrg;
      },
      findUnique: async ({ where }: any) => {
        const org = orgs.find((o) => o.id === where.id);
        if (!org) return null;
        return {
          ...org,
          _count: {
            members: memberships.filter((m) => m.organizationId === org.id).length,
            databaseConnections: 0,
          },
        };
      },
      findMany: async () => orgs,
    },
    organizationMember: {
      findUnique: async ({ where }: any) => {
        if (where.organizationId_userId) {
          const { organizationId, userId } = where.organizationId_userId;
          return memberships.find((m) => m.organizationId === organizationId && m.userId === userId) || null;
        }
        return null;
      },
      findMany: async ({ where }: any) => {
        let result = memberships;
        if (where?.userId) {
          result = result.filter((m) => m.userId === where.userId);
        }
        if (where?.organizationId) {
          result = result.filter((m) => m.organizationId === where.organizationId);
        }
        return result.map((m) => ({
          ...m,
          organization: orgs.find((o) => o.id === m.organizationId),
          user: users.find((u) => u.id === m.userId),
        }));
      },
      create: async ({ data }: any) => {
        const member = {
          id: `mem-${Date.now()}`,
          organizationId: data.organizationId,
          userId: data.userId,
          role: data.role,
          createdAt: new Date(),
        };
        memberships.push(member);
        return {
          ...member,
          user: users.find((u) => u.id === data.userId),
        };
      },
    },
  } as unknown as PrismaClient;

  return mock;
}
