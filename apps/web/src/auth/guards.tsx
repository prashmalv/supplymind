import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Permission } from '@supplymind/shared';
import { useAuth } from './AuthProvider';
import { can } from '../lib/rbac';

/** Route guard: requires an authenticated session (and optionally a permission). */
export const RequireAuth: React.FC<{ perm?: Permission; children: React.ReactNode }> = ({
  perm,
  children,
}) => {
  const { status, role } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#020617] text-slate-500 dark:text-slate-400">
        <div className="animate-pulse text-sm tracking-widest uppercase">Loading SupplyMind…</div>
      </div>
    );
  }
  if (status === 'anon') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (perm && !can(role, perm)) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
};

/** Inline guard for buttons/sections. Renders children only if permitted. */
export const Can: React.FC<{ perm: Permission; children: React.ReactNode; fallback?: React.ReactNode }> = ({
  perm,
  children,
  fallback = null,
}) => {
  const { role } = useAuth();
  return <>{can(role, perm) ? children : fallback}</>;
};
