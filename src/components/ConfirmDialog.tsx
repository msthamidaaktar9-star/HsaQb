import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title = 'আপনি কি নিশ্চিত?',
  message = 'এই কাজটি সম্পন্ন করার পর পরিবর্তন করা নাও যেতে পারে।',
  confirmText = 'হ্যাঁ',
  cancelText = 'না',
  onConfirm,
  onCancel,
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white w-full max-w-[340px] rounded-2xl shadow-2xl border border-[#D5D9E2] p-5 space-y-4 animate-scale-up">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isDestructive ? 'bg-red-50 text-red-600' : 'bg-[#EEF1FD] text-[#3B4FD8]'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="text-base font-semibold text-[#1B1F2A]">
              {title}
            </h3>
          </div>
        </div>

        {message && (
          <p id="confirm-dialog-desc" className="text-sm text-slate-600 leading-relaxed">
            {message}
          </p>
        )}

        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            aria-label={cancelText}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-[#D5D9E2] text-sm font-medium text-[#1B1F2A] bg-white hover:bg-[#F2F4F8] active:bg-[#E5E9F0] transition-colors flex items-center justify-center"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            aria-label={confirmText}
            className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-colors flex items-center justify-center ${
              isDestructive
                ? 'bg-[#EF4444] hover:bg-red-600 active:bg-red-700'
                : 'bg-[#3B4FD8] hover:bg-[#2A3BB0] active:bg-[#202E91]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
