'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = 'info'
}: ConfirmModalProps) {
  
  const colors = {
    info: 'bg-blue-600 hover:bg-blue-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    danger: 'bg-red-600 hover:bg-red-700',
    success: 'bg-green-600 hover:bg-green-700'
  };

  const icons = {
    info: <CheckCircle2 className="text-blue-400" size={28} />,
    warning: <AlertTriangle className="text-amber-400" size={28} />,
    danger: <XCircle className="text-red-400" size={28} />,
    success: <CheckCircle2 className="text-green-400" size={28} />
  };

  const borderColors = {
    info: 'border-blue-500/30',
    warning: 'border-amber-500/30',
    danger: 'border-red-500/30',
    success: 'border-green-500/30'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative w-full max-w-md bg-slate-900 border-2 ${borderColors[type]} rounded-2xl shadow-2xl overflow-hidden`}
          >
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl bg-slate-800 border border-slate-700 shadow-inner`}>
                  {icons[type]}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-white leading-tight mb-1">
                    {title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700 active:scale-95"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onCancel(); // Close after confirm
                  }}
                  className={`flex-1 py-3 px-4 ${colors[type]} text-white font-bold rounded-xl shadow-lg transition-all active:scale-95`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
