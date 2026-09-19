import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import rlaiLogo from '../../logo/rlailogo.png';

export const LoginPage: React.FC = () => {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'authed') {
    return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#020617] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900 dark:via-[#020617] dark:to-[#020617] px-4">
      <div className="w-full max-w-md liquid-card rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <img src={rlaiLogo} alt="RLAI" className="h-11 w-auto flex-shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">SupplyMind</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Making your chain intelligent
            </p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Sign in</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Access your organization's supply-chain intelligence.</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/70 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
              placeholder="you@company.com"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/70 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
              placeholder="••••••••"
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
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-all disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};
