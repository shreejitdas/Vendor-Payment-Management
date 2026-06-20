'use client';

import { useToast } from '@/hooks/useToast';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function ToastProvider() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 transform translate-y-0 scale-100 ${
              isSuccess
                ? 'bg-emerald-950/90 border-emerald-800 text-emerald-100'
                : isError
                ? 'bg-rose-950/90 border-rose-800 text-rose-100'
                : 'bg-zinc-900/90 border-zinc-800 text-zinc-100'
            }`}
          >
            {isSuccess && <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />}
            {isError && <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />}
            {!isSuccess && !isError && <Info className="h-5 w-5 shrink-0 text-indigo-400 mt-0.5" />}

            <div className="flex-1">
              <h3 className="text-sm font-semibold">{toast.title}</h3>
              {toast.description && (
                <p className="mt-1 text-xs opacity-90 leading-normal">{toast.description}</p>
              )}
            </div>

            <button
              onClick={() => dismiss(toast.id)}
              className="text-current opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
