import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils'; // Assumes clsx/tailwind-merge is here

export type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
  visible: boolean;
}

interface ToastContextType {
  toast: (options: ToastOptions | string) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (options: ToastOptions | string) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prev) => [...prev, { ...opts, id, type: opts.type || 'info', visible: true, duration: opts.duration || 4000 }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: false } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300); // Wait for exit animation
  };

  useEffect(() => {
    const timers = toasts.map((t) => {
      if (t.visible) {
        return setTimeout(() => removeToast(t.id), t.duration);
      }
      return null;
    });
    return () => timers.forEach((t) => t && clearTimeout(t));
  }, [toasts]);

  return (
    <ToastContext.Provider value={{
      toast: addToast,
      success: (msg) => addToast({ message: msg, type: 'success' }),
      error: (msg) => addToast({ message: msg, type: 'error' })
    }}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none items-center">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[300px] max-w-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border backdrop-blur-xl transition-all duration-300 ease-out",
                t.visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95",
                t.type === 'success' ? "bg-emerald-50/90 border-emerald-100/50 text-emerald-900" :
                t.type === 'error' ? "bg-red-50/90 border-red-100/50 text-red-900" :
                "bg-white/90 border-gray-100/50 text-gray-900"
              )}
            >
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
              {t.type === 'error' && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
              
              <p className="text-[14px] font-medium leading-snug flex-1">{t.message}</p>
              
              <button 
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-full hover:bg-black/5 transition-colors shrink-0"
              >
                <X className="w-4 h-4 opacity-50" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
