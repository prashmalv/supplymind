import { authStore } from './authStore';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, message: string, body?: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

interface RequestOpts {
  method?: string;
  body?: any;
  /** Skip attaching the Authorization header (used for /auth/refresh). */
  anonymous?: boolean;
  /** Don't attempt a silent refresh+retry on 401. */
  noRetry?: boolean;
  signal?: AbortSignal;
}

let refreshInFlight: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return false;
        const data = await res.json();
        authStore.setAccessToken(data.accessToken);
        return true;
      } catch {
        return false;
      } finally {
        // Cleared on next tick so concurrent callers share this result.
        setTimeout(() => (refreshInFlight = null), 0);
      }
    })();
  }
  return refreshInFlight;
}

async function raw<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const token = authStore.getAccessToken();
  if (!opts.anonymous && token) headers['Authorization'] = `Bearer ${token}`;

  const orgId = authStore.getOrgId();
  if (orgId) headers['X-Org-Id'] = orgId;

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || 'GET',
    headers,
    credentials: 'include',
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (res.status === 401 && !opts.anonymous && !opts.noRetry) {
    const ok = await attemptRefresh();
    if (ok) return raw<T>(path, { ...opts, noRetry: true });
    authStore.triggerForceLogout();
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    let body: any = undefined;
    let message = res.statusText;
    try {
      body = await res.json();
      message = body?.message || message;
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : message, body);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => raw<T>(path, { method: 'GET', signal }),
  post: <T>(path: string, body?: any, opts?: RequestOpts) =>
    raw<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: any) => raw<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => raw<T>(path, { method: 'DELETE' }),
  refresh: attemptRefresh,
};
