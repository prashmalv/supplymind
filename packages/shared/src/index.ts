export * from './types';
export * from './platform';
export * from './mis';

// Explicit re-exports of runtime (non-type) values so bundlers (Vite/rollup)
// reliably detect them as named exports through the CommonJS build — the
// `export *` above compiles to a dynamic re-export that static analysis misses.
export { ROLES, ROLE_PERMISSIONS, roleHasPermission } from './platform';
