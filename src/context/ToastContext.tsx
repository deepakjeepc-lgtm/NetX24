import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, Info, AlertCircle, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'error' | 'loading';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean } | null>(null);

  const hideToast = useCallback(() => {
    setToast(prev => prev ? { ...prev, visible: false } : null);
  }, []);

  const showToast = useCallback(({ message, type = 'success', duration = 3000 }: ToastOptions) => {
    setToast({ message, type, visible: true });
    
    if (duration > 0) {
      setTimeout(() => {
        hideToast();
      }, duration);
    }
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Global Toast */}
      <div 
        className={`fixed bottom-[max(2rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 transform ${
          toast?.visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-[1.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] flex items-center gap-3 border border-slate-800 dark:border-slate-200">
          {toast?.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-500" />}
          {toast?.type === 'info' && <Info className="w-5 h-5 text-blue-400 dark:text-blue-500" />}
          {toast?.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 dark:text-red-500" />}
          {toast?.type === 'loading' && <Loader2 className="w-5 h-5 text-indigo-400 dark:text-indigo-500 animate-spin" />}
          <span className="font-medium text-sm">{toast?.message}</span>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
