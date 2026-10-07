import type { PrismaClient } from '@querymedic/database';

export class OrganizationService {
  constructor(private readonly prisma: PrismaClient) {}

  async getMembership(userId: string, organizationId: string) {
    return this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: { role: true },
    });
  }
}
