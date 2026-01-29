import React, { useState } from 'react';
import { RefreshCcw, Loader2 } from 'lucide-react';
import { Toast, ToastType } from '../../ui/Toast';
import { ConfirmModal } from '../../ui/ConfirmModal';
import { AnimatePresence } from 'framer-motion';

interface RoundResetButtonProps {
    onSuccess?: () => void;
    apiUrl: string;
    confirmMessage?: string;
    label?: string;
    className?: string;
}

export default function RoundResetButton({
    onSuccess,
    apiUrl,
    confirmMessage = "Bạn có chắc muốn Reset TOÀN BỘ dữ liệu vòng này? Hành động này không thể hoàn tác.",
    label = "RESET DATA",
    className = ""
}: RoundResetButtonProps) {
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const performReset = async () => {
        setLoading(true);
        try {
            const res = await fetch(apiUrl, { method: 'POST' });
            if (res.ok) {
                setToast({ message: "Reset thành công!", type: 'success' });
                if (onSuccess) onSuccess();
            } else {
                setToast({ message: "Reset thất bại!", type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setToast({ message: "Lỗi kết nối!", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {toast && (
                    <Toast 
                        message={toast.message} 
                        type={toast.type} 
                        onClose={() => setToast(null)} 
                    />
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={isConfirmOpen}
                title="Xác nhận Reset"
                message={confirmMessage}
                onConfirm={performReset}
                onCancel={() => setIsConfirmOpen(false)}
                type="danger"
            />

            <button 
                onClick={() => setIsConfirmOpen(true)}
                disabled={loading}
                className={`flex items-center gap-2 bg-red-900/30 hover:bg-red-800/50 text-red-500 hover:text-red-400 border border-red-900/50 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
                title="Xóa trạng thái đã thi của tất cả các gói"
            >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                {label}
            </button>
        </>
    );
}
