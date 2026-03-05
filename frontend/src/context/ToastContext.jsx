import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useTheme } from './ThemeContext.jsx';

const ToastContext = createContext(null);

function toastVisual(type) {
  if (type === 'success') {
    return {
      Icon: CheckCircle2,
      ring: 'ring-emerald-300/50 dark:ring-emerald-500/40',
      iconWrap: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400 dark:text-emerald-900'
    };
  }
  if (type === 'error') {
    return {
      Icon: XCircle,
      ring: 'ring-rose-300/50 dark:ring-rose-500/40',
      iconWrap: 'bg-rose-100 text-rose-700 dark:bg-rose-400 dark:text-rose-900'
    };
  }
  if (type === 'warning') {
    return {
      Icon: AlertTriangle,
      ring: 'ring-amber-300/50 dark:ring-amber-500/40',
      iconWrap: 'bg-amber-100 text-amber-700 dark:bg-amber-400 dark:text-amber-900'
    };
  }
  return {
    Icon: Info,
    ring: 'ring-sky-300/50 dark:ring-sky-500/40',
    iconWrap: 'bg-sky-100 text-sky-700 dark:bg-sky-400 dark:text-sky-900'
  };
}

function ToastViewport({ toasts, onRemove }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(92vw,380px)] flex-col gap-3">
      {toasts.map((toast) => {
        const visual = toastVisual(toast.type);
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl p-3 shadow-xl ring-1 backdrop-blur-xl animate-[toast-in_220ms_ease-out] ${visual.ring} ${
              toast.theme === 'dark'
                ? 'bg-[#0b2e57]/82 text-slate-100'
                : 'bg-white/78 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${visual.iconWrap}`}>
                <visual.Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight">{toast.title}</p>
                {toast.message ? <p className="mt-1 text-xs opacity-90">{toast.message}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => onRemove(toast.id)}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100/70 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
                aria-label="Cerrar notificacion"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GlobalModal({ modal, onClose }) {
  if (!modal) return null;
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl backdrop-blur-xl ${
          modal.theme === 'dark'
            ? 'border-cyan-500/35 bg-[#0b2e57]/82 text-slate-100'
            : 'border-cyan-100/80 bg-white/78 text-slate-900'
        }`}
      >
        <h4 className="text-lg font-bold">{modal.title}</h4>
        {modal.message ? <p className="mt-2 text-sm opacity-90">{modal.message}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          {modal.cancelText ? (
            <button
              type="button"
              onClick={() => {
                modal.onCancel?.();
                onClose();
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              {modal.cancelText}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              modal.onConfirm?.();
              onClose();
            }}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white"
          >
            {modal.confirmText || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const { theme } = useTheme();
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    ({ type = 'info', title, message = '', duration = 2300 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const next = { id, type, title, message, theme };
      setToasts((prev) => [...prev, next]);
      window.setTimeout(() => removeToast(id), duration);
      return id;
    },
    [removeToast, theme]
  );

  const openModal = useCallback(
    ({ title, message = '', confirmText = 'OK', cancelText = '', onConfirm, onCancel }) => {
      setModal({ title, message, confirmText, cancelText, onConfirm, onCancel, theme });
    },
    [theme]
  );

  const closeModal = useCallback(() => setModal(null), []);

  const value = useMemo(
    () => ({
      notify,
      success: (title, message = '', duration) => notify({ type: 'success', title, message, duration }),
      error: (title, message = '', duration) => notify({ type: 'error', title, message, duration }),
      warning: (title, message = '', duration) => notify({ type: 'warning', title, message, duration }),
      info: (title, message = '', duration) => notify({ type: 'info', title, message, duration }),
      openModal,
      closeModal
    }),
    [notify, openModal, closeModal]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onRemove={removeToast} />
      <GlobalModal modal={modal} onClose={closeModal} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
