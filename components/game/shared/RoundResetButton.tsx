import React, { useState } from 'react';
import { RefreshCcw, Loader2 } from 'lucide-react';

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

    const handleReset = async () => {
        if (!confirm(confirmMessage)) return;

        setLoading(true);
        try {
            const res = await fetch(apiUrl, { method: 'POST' });
            if (res.ok) {
                alert("Reset thành công!");
                if (onSuccess) onSuccess();
            } else {
                alert("Reset thất bại!");
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            onClick={handleReset}
            disabled={loading}
            className={`flex items-center gap-2 bg-red-900/30 hover:bg-red-800/50 text-red-500 hover:text-red-400 border border-red-900/50 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            title="Xóa trạng thái đã thi của tất cả các gói"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
            {label}
        </button>
    );
}
