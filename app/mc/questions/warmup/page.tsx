"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MCGuard from "@/components/auth/MCGuard";
import Link from "next/link";
import { Question } from "@/types";
import { Toast, ToastType } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Pack {
    _id: string;
    name: string;
    questions: Question[];
    playedBy: string | null;
}

export default function WarmUpQuestionsPage() {
    const [packs, setPacks] = useState<Pack[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Create/Edit Pack State
    const [newPackName, setNewPackName] = useState("");
    const [editingPack, setEditingPack] = useState<Pack | null>(null);

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

    useEffect(() => {
        fetchPacks();
    }, []);

    const fetchPacks = async () => {
        try {
            const res = await fetch('/api/warmup/packs');
            const data = await res.json();
            if (data.success) {
                setPacks(data.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreatePack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPackName.trim()) return;

        setLoading(true);
        try {
            // Generate dummy questions for start (User can edit later)
            const questions = Array.from({ length: 12 }).map((_, i) => ({
                id: crypto.randomUUID(),
                content: `Câu hỏi ${i + 1}`,
                description: `Đáp án`
            }));

            const res = await fetch('/api/warmup/packs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newPackName, questions })
            });

            if (res.ok) {
                setNewPackName("");
                fetchPacks();
            } else {
                setToast({ message: "Failed to create pack", type: 'error' });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePack = async (id: string) => {
        setConfirmConfig({
            isOpen: true,
            title: "Xóa gói câu hỏi",
            message: "Xóa gói câu hỏi này?",
            onConfirm: async () => {
                try {
                    await fetch(`/api/warmup/packs/${id}`, { method: 'DELETE' });
                    setPacks(prev => prev.filter(p => p._id !== id));
                    setToast({ message: "Đã xóa gói câu hỏi", type: 'success' });
                } catch (err) {
                    console.error(err);
                    setToast({ message: "Lỗi khi xóa gói câu hỏi", type: 'error' });
                }
            },
            type: 'danger'
        });
    };

    const handleSavePack = async () => {
        if (!editingPack) return;
        try {
            const res = await fetch(`/api/warmup/packs/${editingPack._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPack)
            });
            if (res.ok) {
                // Update local list
                setPacks(prev => prev.map(p => p._id === editingPack._id ? editingPack : p));
                setEditingPack(null);
                setToast({ message: "Đã lưu gói câu hỏi", type: 'success' });
            } else {
                setToast({ message: "Failed to update pack", type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setToast({ message: "Error saving", type: 'error' });
        }
    };

    const updateQuestion = (idx: number, field: 'content' | 'description', value: string) => {
        if (!editingPack) return;
        const newQuestions = [...editingPack.questions];
        newQuestions[idx] = { ...newQuestions[idx], [field]: value };
        setEditingPack({ ...editingPack, questions: newQuestions });
    };

    const removeQuestion = (idx: number) => {
        if (!editingPack) return;
        const newQuestions = editingPack.questions.filter((_, i) => i !== idx);
        setEditingPack({ ...editingPack, questions: newQuestions });
    };

    const addQuestion = () => {
        if (!editingPack) return;
        const newQ: Question = {
            id: crypto.randomUUID(),
            content: "Nội dung câu hỏi mới...",
            description: "Đáp án..."
        };
        setEditingPack({ ...editingPack, questions: [...editingPack.questions, newQ] });
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
                <header className="mb-12 border-b border-amber-900/50 pb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-amber-500 font-display">QUẢN LÝ GÓI CÂU HỎI VÒNG 1</h1>
                        <Link href="/mc/dashboard" className="text-slate-400 hover:text-white underline mt-2 block">
                            &larr; Quay lại Quản Trị MC
                        </Link>
                    </div>
                </header>

                {/* EDIT PACK MODAL */}
                <AnimatePresence>
                    {editingPack && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl my-8 flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
                                    <h2 className="text-2xl font-bold text-amber-500">Chỉnh Sửa Gói Câu Hỏi</h2>
                                    <div className="flex gap-3">
                                        <button onClick={handleSavePack} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold">Lưu Lại</button>
                                        <button onClick={() => setEditingPack(null)} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-6 py-2 rounded-lg font-bold">Đóng</button>
                                    </div>
                                </div>
                                
                                <div className="p-6 overflow-y-auto flex-1">
                                    <div className="mb-6">
                                        <label className="block text-slate-400 text-sm mb-1 uppercase font-bold">Tên Gói</label>
                                        <input 
                                            value={editingPack.name}
                                            onChange={e => setEditingPack({ ...editingPack, name: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg font-bold text-lg"
                                        />
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-300 mb-4 flex justify-between">
                                        <span>Danh Sách Câu Hỏi ({editingPack.questions.length})</span>
                                        <button onClick={addQuestion} className="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-white">+ Thêm Câu</button>
                                    </h3>

                                    <div className="space-y-4">
                                        {editingPack.questions.map((q, idx) => (
                                            <div key={q.id || idx} className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl flex gap-4 items-start group hover:border-slate-600 transition-colors">
                                                <div className="bg-slate-800 w-8 h-8 flex items-center justify-center rounded-full font-mono text-slate-400 font-bold shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs text-slate-500 uppercase block mb-1">Nội Dung</label>
                                                        <textarea 
                                                            value={q.content}
                                                            onChange={e => updateQuestion(idx, 'content', e.target.value)}
                                                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white h-20 resize-none focus:border-amber-500 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-500 uppercase block mb-1">Đáp Án</label>
                                                        <textarea 
                                                            value={q.description}
                                                            onChange={e => updateQuestion(idx, 'description', e.target.value)}
                                                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-green-400 h-20 resize-none focus:border-green-500 outline-none font-mono text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => removeQuestion(idx)}
                                                    className="text-red-500 hover:bg-red-900/20 p-2 rounded shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Xóa câu hỏi này"
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* ADD FORM */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 sticky top-8">
                            <h2 className="text-xl font-bold mb-4 text-cyan-400">Thêm Gói Mới</h2>
                            <form onSubmit={handleCreatePack} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Tên Gói</label>
                                    <input
                                        type="text"
                                        value={newPackName}
                                        onChange={(e) => setNewPackName(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-amber-500 text-white"
                                        placeholder="Ví dụ: Gói Toán Học"
                                        disabled={loading}
                                    />
                                    <p className="text-xs text-slate-500 mt-2">* Tự động tạo 12 câu hỏi mẫu.</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold py-3 rounded-lg hover:from-amber-500 hover:to-amber-400 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? "Đang tạo..." : "Tạo Gói Câu Hỏi"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* LIST */}
                    <div className="lg:col-span-2">
                         <h2 className="text-xl font-bold mb-4 text-slate-300 flex items-center justify-between">
                            <span>Danh Sách Gói ({packs.length})</span>
                         </h2>
                         
                         <div className="space-y-3">
                            <AnimatePresence>
                                {packs.map(pack => (
                                    <motion.div
                                        key={pack._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex justify-between items-center group hover:border-slate-700 transition-colors"
                                    >
                                        <div 
                                            className="cursor-pointer flex-1"
                                            onClick={() => setEditingPack(pack)}
                                        >
                                            <h3 className="font-bold text-lg text-slate-200 group-hover:text-amber-500 transition-colors">{pack.name}</h3>
                                            <div className="text-xs text-slate-500 font-mono mt-1">
                                                {pack.questions.length} câu hỏi • {pack.playedBy ? <span className="text-green-500">Đã thi</span> : "Chưa thi"}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setEditingPack(pack)}
                                                className="px-3 py-1 bg-slate-800 hover:bg-cyan-900 text-cyan-500 rounded text-sm font-bold border border-slate-700"
                                            >
                                                Sửa
                                            </button>
                                            <button 
                                                onClick={() => handleDeletePack(pack._id)}
                                                className="px-3 py-1 bg-slate-800 hover:bg-red-900 text-red-500 rounded text-sm font-bold border border-slate-700"
                                            >
                                                Xoá
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                         </div>
                    </div>
                </div>
            </div>
        </MCGuard>
    );
}
