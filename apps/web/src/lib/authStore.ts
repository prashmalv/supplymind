// Module-level bridge between the AuthProvider (React state) and the apiClient
// (plain module). The access token lives only in memory — never localStorage —
// so an XSS payload can't read a persisted token. The refresh token is an
// httpOnly cookie the browser sends automatically to /api/auth/refresh.

let accessToken: string | null = null;
let currentOrgId: string | null = null;
let forceLogout: (() => void) | null = null;

const LAST_ORG_KEY = 'sm_last_org';

export const authStore = {
  getAccessToken: () => accessToken,
  setAccessToken: (t: string | null) => {
    accessToken = t;
  },

  getOrgId: () => currentOrgId,
  setOrgId: (id: string | null) => {
    currentOrgId = id;
    if (id) localStorage.setItem(LAST_ORG_KEY, id);
    else localStorage.removeItem(LAST_ORG_KEY);
  },
  getLastOrgId: () => localStorage.getItem(LAST_ORG_KEY),

  registerForceLogout: (fn: () => void) => {
    forceLogout = fn;
  },
  triggerForceLogout: () => {
    accessToken = null;
    forceLogout?.();
  },
};
