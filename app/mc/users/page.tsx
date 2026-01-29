"use client";

import { useMCSocket } from "@/hooks/socket/useMCSocket";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MCGuard from "@/components/auth/MCGuard";
import Link from "next/link"; // Correct Next 14 Import
import { Toast, ToastType } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Player {
  _id: string;
  name: string;
  createdAt: string;
}

export default function MCUsersPage() {
  const socket = useMCSocket();
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerPassword, setNewPlayerPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Edit State
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editLoading, setEditLoading] = useState(false);

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

  // Fetch players on mount
  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await fetch("/api/players");
      const data = await res.json();
      if (data.success) {
        setPlayers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch players", error);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            name: newPlayerName,
            password: newPlayerPassword // Send password
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayers((prev) => [data.data, ...prev]);
        setNewPlayerName("");
        setNewPlayerPassword("");
      } else {
        setToast({ message: "Lỗi: " + data.error, type: 'error' });
      }
    } catch (error) {
      console.error("Failed to add player", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (player: Player) => {
    setEditingPlayer(player);
    setEditName(player.name);
    setEditPassword(""); // Don't show old password for security or just leave blank to not change? 
    // User requested "edit password". We can't easily retrieve it if hash, but here we store plain text in meta.
    // However, the `Player` interface defined above doesn't have `meta`. We need to fetch it or update interface.
    // For now, let's just allow setting a NEW password. If left blank, maybe keep old?
    // But the current API doesn't return `meta` in the `Player` interface in this file.
    // Let's type it better. But for quick implementation, we accept inputting a new password to overwrite.
  };

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer || !editName.trim()) return;

    setEditLoading(true);
    try {
        const body = {
            name: editName,
            meta: editPassword ? { password: editPassword } : undefined // Only update meta if password provided? 
            // Warning: If we don't send meta, updatePlayer might ignore it or we need logic in backend.
            // But wait, backend `updatePlayer` takes `data`. If `meta` is undefined, `findByIdAndUpdate` won't touch `meta`.
            // So this is safe.
        };

        const res = await fetch(`/api/players/${editingPlayer._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data.success) {
            setPlayers(prev => prev.map(p => p._id === editingPlayer._id ? { ...p, name: editName } : p));
            setEditingPlayer(null);
            setEditName("");
            setEditPassword("");
        } else {
            setToast({ message: "Lỗi: " + data.error, type: 'error' });
        }
    } catch (error) {
        console.error("Failed to update player", error);
    } finally {
        setEditLoading(false);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    setConfirmConfig({
        isOpen: true,
        title: "Xóa người chơi",
        message: "Bạn có chắc chắn muốn xóa người chơi này?",
        onConfirm: async () => {
            try {
                const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
                const data = await res.json();
                if (data.success) {
                    setPlayers((prev) => prev.filter((p) => p._id !== id));
                    setToast({ message: "Đã xóa người chơi", type: 'success' });
                }
            } catch (error) {
                console.error("Failed to delete player", error);
                setToast({ message: "Lỗi khi xóa người chơi", type: 'error' });
            }
        },
        type: 'danger'
    });
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
                  <h1 className="text-4xl font-bold text-amber-500 font-display">QUẢN LÝ USER</h1>
                  <Link href="/mc/dashboard" className="text-slate-400 hover:text-white underline mt-2 block">
                    &larr; Quay lại Dashboard
                  </Link>
                </div>
                <div className="text-right">
                   <div className={`text-sm font-mono ${socket?.connected ? 'text-green-500' : 'text-red-500'}`}>
                        SOCKET: {socket?.connected ? 'ĐÃ KẾT NỐI' : 'MẤT KẾT NỐI'}
                   </div>
                </div>
            </header>

            {/* EDIT MODAL */}
            <AnimatePresence>
                {editingPlayer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl"
                        >
                            <h2 className="text-xl font-bold mb-4 text-amber-500">Chỉnh Sửa Người Chơi</h2>
                            <form onSubmit={handleUpdatePlayer} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Tên Người Chơi</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-amber-500 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Mật Khẩu Mới (Để trống nếu không đổi)</label>
                                    <input
                                        type="text"
                                        value={editPassword}
                                        onChange={(e) => setEditPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-amber-500 text-white"
                                        placeholder="Nhập password mới..."
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingPlayer(null)}
                                        className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-lg hover:bg-slate-700"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editLoading}
                                        className="flex-1 bg-amber-600 text-white font-bold py-3 rounded-lg hover:bg-amber-500 disabled:opacity-50"
                                    >
                                        {editLoading ? "Đang lưu..." : "Lưu Thay Đổi"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* ADD PLAYER FORM */}
                <div className="lg:col-span-1">
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 sticky top-8">
                    <h2 className="text-xl font-bold mb-4 text-cyan-400">Thêm Người Chơi Mới</h2>
                    <form onSubmit={handleAddPlayer} className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Tên Người Chơi</label>
                        <input
                          type="text"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-amber-500 transition-colors"
                          placeholder="Nhập tên..."
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Mật Khẩu (Đơn giản)</label>
                        <input
                          type="text"
                          value={newPlayerPassword}
                          onChange={(e) => setNewPlayerPassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-amber-500 transition-colors"
                          placeholder="Nhập password..."
                          disabled={loading}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold py-3 rounded-lg hover:from-amber-500 hover:to-amber-400 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {loading ? "Đang thêm..." : "Thêm Người Chơi"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* PLAYER LIST */}
                <div className="lg:col-span-2">
                   <h2 className="text-xl font-bold mb-4 text-slate-300 flex items-center justify-between">
                      <span>Danh Sách Người Chơi</span>
                      <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-sm">{players.length}</span>
                   </h2>
                   
                   <div className="space-y-3">
                     <AnimatePresence>
                       {players.map((player) => (
                         <motion.div
                           key={player._id}
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: 20 }}
                           className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex justify-between items-center group hover:border-slate-700 transition-colors"
                         >
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 font-bold">
                                {player.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-slate-200">{player.name}</h3>
                                <div className="text-xs text-slate-500 font-mono">ID: {player._id}</div>
                              </div>
                           </div>

                           <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button
                                onClick={() => handleEditClick(player)}
                                className="p-2 text-cyan-500 hover:bg-cyan-950/30 rounded-lg transition-colors"
                                title="Edit Player"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                             </button>
                             <button 
                                onClick={() => handleDeletePlayer(player._id)}
                                className="p-2 text-red-500 hover:bg-red-950/30 rounded-lg transition-colors"
                                title="Delete Player"
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
