import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY } from './decorators';

/**
 * Resolves the active organization from the `X-Org-Id` header and verifies the
 * authenticated user is a member. Attaches `req.orgId` and `req.membershipRole`.
 * Platform admins may act on any org. Absence of the header is allowed (routes
 * that don't need an org, e.g. /auth/me, /orgs).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) return true; // JwtAuthGuard handles unauthenticated

    const orgId: string | undefined = req.headers['x-org-id'];
    if (!orgId) {
      req.orgId = undefined;
      req.membershipRole = undefined;
      return true;
    }

    if (user.isPlatformAdmin) {
      req.orgId = orgId;
      req.membershipRole = 'PLATFORM_ADMIN';
      return true;
    }

    const membership = await this.prisma.membership.findUnique({
      where: { orgId_userId: { orgId, userId: user.userId } },
    });
    if (!membership) {
      throw new ForbiddenException('Not a member of the requested organization');
    }

    req.orgId = orgId;
    req.membershipRole = membership.role;
    return true;
  }
}
