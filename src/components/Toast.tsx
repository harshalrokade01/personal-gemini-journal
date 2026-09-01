import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`pointer-events-auto p-3.5 rounded-xl border shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm animate-in slide-in-from-bottom-3 duration-200 ${
        toast.type === 'success'
          ? 'bg-[var(--bg-surface)] border-emerald-500/30 text-emerald-500 shadow-emerald-500/5'
          : toast.type === 'error'
          ? 'bg-[var(--bg-surface)] border-rose-500/30 text-rose-500 shadow-rose-500/5'
          : 'bg-[var(--bg-surface)] border-[var(--border-primary)] text-[var(--text-primary)]'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
        {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
        {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-500 shrink-0" />}
        <span className="font-medium text-[var(--text-primary)]">{toast.text}</span>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
