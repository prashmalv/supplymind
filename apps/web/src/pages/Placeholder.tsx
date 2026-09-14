import React from 'react';
import { Construction } from 'lucide-react';

export const Placeholder: React.FC<{ title: string; note?: string }> = ({ title, note }) => (
  <div className="flex flex-col items-center justify-center py-32 text-center">
    <div className="w-14 h-14 rounded-2xl liquid-card flex items-center justify-center mb-4">
      <Construction size={24} className="text-red-400" />
    </div>
    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
    <p className="text-sm text-slate-500 max-w-md">
      {note || 'This section is being built as part of the platform rollout.'}
    </p>
  </div>
);
