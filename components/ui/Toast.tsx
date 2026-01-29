'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="text-green-500" />,
    error: <XCircle className="text-red-500" />,
    info: <AlertCircle className="text-blue-500" />,
    warning: <AlertCircle className="text-amber-500" />
  };

  const colors = {
    success: 'bg-green-900/90 border-green-500',
    error: 'bg-red-900/90 border-red-500',
    info: 'bg-blue-900/90 border-blue-500',
    warning: 'bg-amber-900/90 border-amber-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={`fixed top-4 right-4 z-50 ${colors[type]} border-2 rounded-lg p-4 flex items-center gap-3 shadow-2xl max-w-md`}
    >
      {icons[type]}
      <p className="text-white font-semibold">{message}</p>
    </motion.div>
  );
}
