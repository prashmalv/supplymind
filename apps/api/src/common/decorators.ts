import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Permission } from '@supplymind/shared';

export const IS_PUBLIC_KEY = 'isPublic';
/** Mark a route as not requiring authentication. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const PERMISSIONS_KEY = 'requiredPermissions';
/** Require the caller's role in the active org to grant ALL listed permissions. */
export const RequirePermissions = (...perms: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, perms);

export interface AuthUser {
  userId: string;
  email: string;
  isPlatformAdmin: boolean;
}

/** Injects the authenticated user (from the JWT) into a handler param. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);

/** Injects the active org id (resolved by TenantInterceptor) into a handler param. */
export const CurrentOrg = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.orgId;
  },
);
