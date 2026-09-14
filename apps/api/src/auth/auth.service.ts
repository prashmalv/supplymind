import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { AuthTokens, Membership } from '@supplymind/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toSharedRole } from '../common/rbac';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async buildTokens(userId: string): Promise<{ tokens: AuthTokens; refreshToken: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { memberships: { include: { org: true } } },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      isPlatformAdmin: user.isPlatformAdmin,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessTtl'),
    });

    // Opaque refresh token, stored hashed.
    const refreshToken = randomBytes(48).toString('hex');
    const ttlDays = this.config.get<number>('jwt.refreshTtlDays') ?? 30;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: this.hashToken(refreshToken), expiresAt },
    });

    const memberships: Membership[] = user.memberships.map((m) => ({
      orgId: m.orgId,
      orgName: m.org.name,
      role: toSharedRole(m.role),
    }));

    return {
      tokens: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status.toLowerCase() as 'active' | 'invited' | 'disabled',
          createdAt: user.createdAt.toISOString(),
        },
        memberships,
      },
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid email or password');
    if (user.status === 'DISABLED') throw new UnauthorizedException('Account disabled');
    return this.buildTokens(user.id);
  }

  async refresh(rawToken: string | undefined) {
    if (!rawToken) throw new UnauthorizedException('Missing refresh token');
    const tokenHash = this.hashToken(rawToken);
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired session');
    }
    // Rotate: revoke the old token, issue a fresh pair.
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    return this.buildTokens(record.userId);
  }

  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    const tokenHash = this.hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { memberships: { include: { org: true } } },
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status.toLowerCase() as 'active' | 'invited' | 'disabled',
        createdAt: user.createdAt.toISOString(),
      },
      memberships: user.memberships.map((m) => ({
        orgId: m.orgId,
        orgName: m.org.name,
        role: toSharedRole(m.role),
      })),
    };
  }

  async acceptInvite(token: string, name: string, password: string) {
    const tokenHash = this.hashToken(token);
    const invite = await this.prisma.invite.findUnique({ where: { tokenHash } });
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired invite');
    }
    const email = invite.email.toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.upsert({
        where: { email },
        update: { name, passwordHash, status: 'ACTIVE' },
        create: { email, name, passwordHash, status: 'ACTIVE' },
      });
      await tx.membership.upsert({
        where: { orgId_userId: { orgId: invite.orgId, userId: u.id } },
        update: { role: invite.role },
        create: { orgId: invite.orgId, userId: u.id, role: invite.role },
      });
      await tx.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
      return u;
    });

    return this.buildTokens(user.id);
  }
}
