import { Permission, Role, roleHasPermission } from '@supplymind/shared';

/** UI-side permission check. The API enforces the real thing; this is UX only. */
export function can(role: Role | undefined, perm: Permission): boolean {
  if (!role) return false;
  return roleHasPermission(role, perm);
}
