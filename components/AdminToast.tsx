import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

type AdminToastProps = {
  message: string | null;
  tone?: 'success' | 'error' | 'info' | 'warning';
  onClick?: (() => void) | null;
  actionLabel?: string | null;
};

const toneConfig = {
  success: {
    wrapper: 'bg-emerald-500 text-white shadow-emerald-200',
    icon: CheckCircle2
  },
  error: {
    wrapper: 'bg-red-500 text-white shadow-red-200',
    icon: XCircle
  },
  warning: {
    wrapper: 'bg-amber-500 text-white shadow-amber-200',
    icon: AlertTriangle
  },
  info: {
    wrapper: 'bg-gray-900 text-white shadow-black/20',
    icon: Info
  }
} as const;

const AdminToast: React.FC<AdminToastProps> = ({ message, tone = 'success', onClick = null, actionLabel = null }) => {
  if (!message) return null;

  const config = toneConfig[tone] || toneConfig.info;
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick || undefined}
      className={`fixed top-24 right-6 z-[120] px-5 py-4 rounded-2xl shadow-2xl font-black text-sm flex items-center gap-3 text-left ${config.wrapper} ${
        onClick ? 'hover:scale-[1.01] transition-transform cursor-pointer' : 'cursor-default'
      }`}
    >
      <Icon size={18} />
      <div className="flex flex-col">
        <span>{message}</span>
        {onClick && actionLabel ? (
          <span className="text-[10px] font-black uppercase tracking-widest text-white/80 mt-1">
            {actionLabel}
          </span>
        ) : null}
      </div>
    </button>
  );
};

export default AdminToast;
