import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  type?: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentToast, setCurrentToast] = useState<ToastItem | null>(null);
  const timerRef = useRef<number | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCurrentToast(null);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    const id = Date.now();
    setCurrentToast({ id, message, type });

    timerRef.current = window.setTimeout(() => {
      setCurrentToast((prev) => (prev?.id === id ? null : prev));
      timerRef.current = null;
    }, 2000); // 2 seconds as specified
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {currentToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[360px] animate-fade-in-up pointer-events-none"
        >
          <div
            className={`pointer-events-auto flex items-center justify-between gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              currentToast.type === 'success'
                ? 'bg-[#10B981] text-white border-green-600'
                : currentToast.type === 'error'
                ? 'bg-[#EF4444] text-white border-red-600'
                : currentToast.type === 'warning'
                ? 'bg-[#F59E0B] text-white border-amber-600'
                : 'bg-[#1B1F2A] text-white border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 flex-1">
              {currentToast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />}
              {currentToast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-white" />}
              {currentToast.type === 'warning' && <AlertCircle className="w-4 h-4 shrink-0 text-white" />}
              {currentToast.type === 'info' && <Info className="w-4 h-4 shrink-0 text-white" />}
              <span className="leading-snug">{currentToast.message}</span>
            </div>
            <button
              type="button"
              onClick={hideToast}
              aria-label="বার্তা বন্ধ করুন"
              className="p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
