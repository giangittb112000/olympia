"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Save, Image as ImageIcon, Upload } from 'lucide-react';
import MCGuard from '@/components/auth/MCGuard';
import { Toast, ToastType } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AnimatePresence } from "framer-motion";

interface Row {
    question: string;
    answer: string;
}


export default function ObstacleQuestionsPage() {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState<{
        name: string;
        image: string;
        finalCNV: string;
        rows: Row[];
    }>({
        name: '',
        image: '',
        finalCNV: '',
        rows: Array.from({ length: 4 }, () => ({ question: '', answer: '' }))
    });

    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'info' | 'warning' | 'danger' | 'success';
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
    });

    // Singleton Fetch: Get the current set
    const fetchSet = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/obstacles');
            const data = await res.json();
            if(data.success && data.data) {
                setFormData({
                    name: data.data.name,
                    image: data.data.image,
                    finalCNV: data.data.finalCNV,
                    rows: data.data.rows
                });
            }
        } catch (e) {
            console.error("Failed to fetch", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
             fetchSet();
        }, 0);
        return () => clearTimeout(t);
    }, [fetchSet]);


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: data,
            });
            const json = await res.json();
            if (json.success) {
                setFormData(prev => ({ ...prev, image: json.url }));
            } else {
                setToast({ message: "Upload failed: " + json.error, type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setToast({ message: "Upload error", type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.image || !formData.finalCNV) {
            setToast({ message: "Vui lòng nhập đủ thông tin chung!", type: 'warning' });
            return;
        }
        if (formData.rows.some(r => !r.question || !r.answer)) {
            setToast({ message: "Vui lòng nhập đủ 4 hàng ngang!", type: 'warning' });
            return;
        }

        setLoading(true);
        // Always POST to upsert singleton
        const res = await fetch('/api/admin/obstacles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            setToast({ message: "Lưu thành công!", type: 'success' });
            // No need to reset, keep editing the singleton
        } else {
            setToast({ message: "Lỗi khi lưu!", type: 'error' });
        }
        setLoading(false);
    };

    return (
        <MCGuard>
            <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
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
                    isOpen={confirmConfig.isOpen}
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    onConfirm={confirmConfig.onConfirm}
                    onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                    type={confirmConfig.type}
                />
                <div className="max-w-6xl mx-auto">
                    <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
                        <div>
                            <h1 className="text-3xl font-black text-amber-500 uppercase">Cấu Hình Vượt Chướng Ngại Vật</h1>
                            <Link href="/mc/dashboard" className="text-slate-500 hover:text-white text-sm mt-2 block">&larr; Quay về Dashboard</Link>
                        </div>
                    </header>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl animate-in fade-in slide-in-from-bottom-4 shadow-xl">
                        
                        {loading && (
                             <div className="mb-4 p-2 bg-blue-900/20 text-blue-400 text-center text-sm rounded animate-pulse">
                                 Đang tải dữ liệu...
                             </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* LEFT: General Info & Image */}
                            <div className="space-y-6">
                                    <div>
                                    <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">Tên Bộ Câu Hỏi (Trận Đấu)</label>
                                    <input 
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full bg-slate-800 border-slate-700 rounded p-2 focus:border-amber-500 outline-none text-white font-bold"
                                        placeholder="VD: Chung Kết Năm 2024"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">Từ Khóa Chướng Ngại Vật (CNV)</label>
                                    <input 
                                        value={formData.finalCNV}
                                        onChange={e => setFormData({...formData, finalCNV: e.target.value})}
                                        className="w-full bg-slate-800 border-amber-900/50 rounded p-2 focus:border-amber-500 outline-none text-amber-400 font-bold tracking-widest uppercase text-lg"
                                        placeholder="VD: SƠN TINH THỦY TINH"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-mono text-slate-500 mb-1 uppercase">Hình Ảnh Chướng Ngại Vật</label>
                                    
                                    {/* Upload Control */}
                                    <div className="flex gap-2 mb-2">
                                        <input 
                                            ref={fileInputRef}
                                            type="file" 
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded text-sm font-bold border border-slate-600 flex items-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            {uploading ? <span className="animate-spin">⏳</span> : <Upload size={16} />}
                                            {uploading ? "Đang tải lên..." : "Tải Ảnh Lên"}
                                        </button>
                                        <input 
                                            value={formData.image}
                                            onChange={e => setFormData({...formData, image: e.target.value})}
                                            className="flex-1 bg-slate-800 border-slate-700 rounded p-2 focus:border-slate-500 outline-none text-slate-400 text-xs"
                                            placeholder="Hoặc dán URL ảnh..."
                                        />
                                    </div>

                                    {/* Image Preview */}
                                    <div className="mt-4 aspect-video bg-black rounded-lg border border-slate-700 overflow-hidden relative group shadow-inner">
                                        {formData.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={formData.image} alt="Preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-slate-700 flex-col gap-2">
                                                <ImageIcon size={48} />
                                                <span className="text-sm font-mono">NO IMAGE</span>
                                            </div>
                                        )}
                                            
                                            {/* Grid Overlay Guide (5 Pieces Simulation) */}
                                            {formData.image && (
                                                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
                                                    <div className="border-r border-b border-white/30 relative">
                                                        <span className="absolute top-2 left-2 text-[10px] bg-black/50 px-1 rounded text-white/50">1</span>
                                                    </div>
                                                    <div className="border-b border-white/30 relative">
                                                        <span className="absolute top-2 right-2 text-[10px] bg-black/50 px-1 rounded text-white/50">2</span>
                                                    </div>
                                                    <div className="border-r border-white/30 relative">
                                                        <span className="absolute bottom-2 left-2 text-[10px] bg-black/50 px-1 rounded text-white/50">3</span>
                                                    </div>
                                                    <div className="relative">
                                                        <span className="absolute bottom-2 right-2 text-[10px] bg-black/50 px-1 rounded text-white/50">4</span>
                                                    </div>
                                                    {/* Central Piece Hint */}
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 border border-amber-500/50 rounded flex items-center justify-center bg-black/20">
                                                        <span className="text-[10px] text-amber-500/80">CENTER</span>
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 text-center">*Tỷ lệ khuyến nghị 16:9. Hệ thống sẽ tự động chia thành 5 mảnh (4 góc + 1 tâm) khi hiển thị.</p>
                                </div>
                            </div>

                            {/* RIGHT: Rows */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase border-b border-slate-800 pb-2 mb-4">4 Các Câu Hỏi Hàng Ngang</h3>
                                {formData.rows.map((row, idx) => (
                                    <div key={idx} className="bg-slate-950/30 p-4 rounded border border-slate-800 hover:border-slate-600 transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-cyan-500 uppercase bg-cyan-950/30 px-2 py-1 rounded">Hàng Ngang {idx + 1}</span>
                                        </div>
                                        <textarea
                                            value={row.question}
                                            onChange={e => {
                                                const newRows = [...formData.rows];
                                                newRows[idx] = { ...newRows[idx], question: e.target.value };
                                                setFormData({...formData, rows: newRows});
                                            }}
                                            className="w-full bg-slate-800 border-slate-700 rounded p-2 text-sm text-slate-300 mb-2 h-16 resize-none focus:border-cyan-500 outline-none"
                                            placeholder={`Nhập câu hỏi cho hàng ngang số ${idx + 1}...`}
                                        />
                                        <input
                                            value={row.answer}
                                            onChange={e => {
                                                const newRows = [...formData.rows];
                                                newRows[idx] = { ...newRows[idx], answer: e.target.value.toUpperCase() };
                                                setFormData({...formData, rows: newRows});
                                            }}
                                            className="w-full bg-slate-900 border-slate-700 rounded p-2 text-sm font-mono text-cyan-400 focus:border-cyan-500 outline-none uppercase font-bold tracking-wider"
                                            placeholder="ĐÁP ÁN"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-800">
                             <Link href="/mc/dashboard" className="px-6 py-3 text-slate-400 hover:text-white font-bold flex items-center">
                                Hủy bỏ
                             </Link>
                            <button 
                                onClick={handleSubmit} 
                                disabled={loading || uploading}
                                className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded font-bold shadow-lg shadow-green-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all"
                            >
                                <Save size={18} /> {loading ? "Đang Lưu..." : "Lưu Cấu Hình"}
                            </button>
                        </div>
                    </div>
                
                </div>
            </div>
        </MCGuard>
    );
}
