import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2 } from 'lucide-react';

const inputCls = 'w-full text-sm rounded-lg px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500/40';

/** Change-password modal available to every signed-in user (demo — no backend). */
export const ChangePasswordModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  if (!open) return null;
  const submit = () => {
    setErr('');
    if (next.length < 8) return setErr('New password must be at least 8 characters.');
    if (next !== confirm) return setErr('New password and confirmation do not match.');
    setDone(true);
    setTimeout(() => { setDone(false); setCur(''); setNext(''); setConfirm(''); onClose(); }, 1400);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm liquid-card rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><KeyRound size={16} className="text-red-500" /> Change Password</span>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={17} /></button>
        </div>
        {done ? (
          <div className="p-8 text-center">
            <CheckCircle2 size={34} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Password updated successfully.</p>
          </div>
        ) : (
          <>
            <div className="p-5 space-y-3">
              <div><label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Current password</label>
                <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">New password</label>
                <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} placeholder="At least 8 characters" /></div>
              <div><label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Confirm new password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} /></div>
              {err && <p className="text-xs text-red-600 dark:text-red-400">{err}</p>}
            </div>
            <div className="px-5 py-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-2">
              <button onClick={onClose} className="text-sm rounded-lg px-4 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">Cancel</button>
              <button onClick={submit} className="text-sm font-semibold rounded-lg px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white">Update Password</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
