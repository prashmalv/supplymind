import { Role as SharedRole, Permission, roleHasPermission } from '@supplymind/shared';
import { Role as PrismaRole } from '@prisma/client';

/** Map the Prisma enum (UPPER_SNAKE) to the shared string role (kebab). */
export function toSharedRole(role: PrismaRole): SharedRole {
  switch (role) {
    case 'PLATFORM_ADMIN':
      return 'platform-admin';
    case 'ORG_ADMIN':
      return 'org-admin';
    case 'ANALYST':
      return 'analyst';
    case 'VIEWER':
    default:
      return 'viewer';
  }
}

export function toPrismaRole(role: SharedRole): PrismaRole {
  switch (role) {
    case 'platform-admin':
      return 'PLATFORM_ADMIN';
    case 'org-admin':
      return 'ORG_ADMIN';
    case 'analyst':
      return 'ANALYST';
    case 'viewer':
    default:
      return 'VIEWER';
  }
}

export function hasPermission(role: PrismaRole, perm: Permission): boolean {
  return roleHasPermission(toSharedRole(role), perm);
}
