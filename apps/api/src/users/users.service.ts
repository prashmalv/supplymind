import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { Role as SharedRole } from '@supplymind/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toPrismaRole, toSharedRole } from '../common/rbac';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async listMembers(orgId: string) {
    const members = await this.prisma.membership.findMany({
      where: { orgId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    return members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: toSharedRole(m.role),
      status: m.user.status.toLowerCase(),
      createdAt: m.createdAt.toISOString(),
    }));
  }

  /** Create an invite; returns the raw token (frontend builds the accept link). */
  async invite(orgId: string, email: string, role: SharedRole, invitedById: string) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.invite.create({
      data: {
        orgId,
        email: email.toLowerCase(),
        role: toPrismaRole(role),
        tokenHash,
        invitedById,
        expiresAt,
      },
    });
    return { token, email: email.toLowerCase(), role, expiresAt: expiresAt.toISOString() };
  }

  async changeRole(orgId: string, userId: string, role: SharedRole) {
    await this.assertNotLastAdminChange(orgId, userId, role);
    await this.prisma.membership.update({
      where: { orgId_userId: { orgId, userId } },
      data: { role: toPrismaRole(role) },
    });
    return { ok: true };
  }

  async removeMember(orgId: string, userId: string) {
    await this.assertNotLastAdminChange(orgId, userId, 'viewer');
    await this.prisma.membership.delete({
      where: { orgId_userId: { orgId, userId } },
    });
    return { ok: true };
  }

  /** Guard the "at least one org-admin" invariant. */
  private async assertNotLastAdminChange(orgId: string, userId: string, newRole: SharedRole) {
    const admins = await this.prisma.membership.findMany({
      where: { orgId, role: 'ORG_ADMIN' },
    });
    const isTargetAdmin = admins.some((a) => a.userId === userId);
    const losesAdmin = isTargetAdmin && newRole !== 'org-admin';
    if (losesAdmin && admins.length <= 1) {
      throw new BadRequestException('An organization must have at least one org-admin');
    }
  }
}
