import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { AuthMe, AuthTokens, Membership, Role, User } from '@supplymind/shared';
import { api } from '../lib/apiClient';
import { authStore } from '../lib/authStore';

type Status = 'loading' | 'authed' | 'anon';

interface AuthContextValue {
  status: Status;
  user: User | null;
  memberships: Membership[];
  currentOrgId: string | null;
  currentOrg: Membership | null;
  role: Role | undefined;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchOrg: (orgId: string) => void;
  setSession: (tokens: AuthTokens) => void;
  refreshMemberships: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function pickOrg(memberships: Membership[]): string | null {
  if (memberships.length === 0) return null;
  const last = authStore.getLastOrgId();
  if (last && memberships.some((m) => m.orgId === last)) return last;
  return memberships[0].orgId;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  const applySession = useCallback((u: User, m: Membership[]) => {
    setUser(u);
    setMemberships(m);
    const orgId = pickOrg(m);
    setCurrentOrgId(orgId);
    authStore.setOrgId(orgId);
    setStatus('authed');
  }, []);

  const clearSession = useCallback(() => {
    authStore.setAccessToken(null);
    authStore.setOrgId(null);
    setUser(null);
    setMemberships([]);
    setCurrentOrgId(null);
    setStatus('anon');
  }, []);

  // Bootstrap: try a silent refresh (httpOnly cookie), then load profile.
  useEffect(() => {
    authStore.registerForceLogout(clearSession);
    (async () => {
      const ok = await api.refresh();
      if (!ok) {
        setStatus('anon');
        return;
      }
      try {
        const me = await api.get<AuthMe>('/auth/me');
        applySession(me.user, me.memberships);
      } catch {
        setStatus('anon');
      }
    })();
  }, [applySession, clearSession]);

  const setSession = useCallback(
    (tokens: AuthTokens) => {
      authStore.setAccessToken(tokens.accessToken);
      applySession(tokens.user, tokens.memberships);
    },
    [applySession],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await api.post<AuthTokens>('/auth/login', { email, password }, { anonymous: true });
      setSession(tokens);
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    clearSession();
  }, [clearSession]);

  const switchOrg = useCallback((orgId: string) => {
    setCurrentOrgId(orgId);
    authStore.setOrgId(orgId);
  }, []);

  const refreshMemberships = useCallback(async () => {
    const me = await api.get<AuthMe>('/auth/me');
    setUser(me.user);
    setMemberships(me.memberships);
    if (!me.memberships.some((m) => m.orgId === currentOrgId)) {
      const orgId = pickOrg(me.memberships);
      setCurrentOrgId(orgId);
      authStore.setOrgId(orgId);
    }
  }, [currentOrgId]);

  const currentOrg = useMemo(
    () => memberships.find((m) => m.orgId === currentOrgId) ?? null,
    [memberships, currentOrgId],
  );

  const value: AuthContextValue = {
    status,
    user,
    memberships,
    currentOrgId,
    currentOrg,
    role: currentOrg?.role,
    login,
    logout,
    switchOrg,
    setSession,
    refreshMemberships,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
