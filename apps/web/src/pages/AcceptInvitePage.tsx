import React, { useState } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Loader2, UserPlus } from 'lucide-react';
import { AuthTokens } from '@supplymind/shared';
import { api } from '../lib/apiClient';
import { useAuth } from '../auth/AuthProvider';

export const AcceptInvitePage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { setSession, status } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'authed') return <Navigate to="/home" replace />;
  if (!token) return <Navigate to="/login" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const tokens = await api.post<AuthTokens>(
        '/auth/accept-invite',
        { token, name: name.trim(), password },
        { anonymous: true },
      );
      setSession(tokens);
      navigate('/home', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Could not accept invite');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] px-4">
      <div className="w-full max-w-md liquid-card rounded-2xl p-8">
        <h1 className="text-xl font-bold text-white mb-1">Accept your invitation</h1>
        <p className="text-sm text-slate-400 mb-6">Set up your account to join the organization.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Full name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900/70 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password (min 8 chars)</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/70 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
          </div>
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-lg px-4 py-2.5 text-sm disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {busy ? 'Creating account…' : 'Join organization'}
          </button>
        </form>
      </div>
    </div>
  );
};
