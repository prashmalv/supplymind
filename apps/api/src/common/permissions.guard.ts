import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '@supplymind/shared';
import { Role as PrismaRole } from '@prisma/client';
import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from './decorators';
import { hasPermission } from './rbac';

/**
 * Enforces @RequirePermissions(...). The caller's role comes from their
 * membership in the active org (set by TenantGuard). Platform admins pass all.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (user?.isPlatformAdmin) return true;

    const role: PrismaRole | undefined = req.membershipRole;
    if (!role) {
      throw new ForbiddenException(
        'An active organization (X-Org-Id header) is required for this action',
      );
    }

    const ok = required.every((perm) => hasPermission(role, perm));
    if (!ok) {
      throw new ForbiddenException('Insufficient permissions for this action');
    }
    return true;
  }
}
