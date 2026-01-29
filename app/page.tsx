"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoleCard } from "@/components/ui/RoleCard";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleMCLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      router.push("/mc/dashboard");
    } else {
      setError("Mật khẩu không chính xác");
      setPassword("");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10 pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="z-10 text-center mb-16"
      >
        <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 drop-shadow-2xl">
          GIỌT DẦU VÀNG
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 font-light tracking-[0.2em] uppercase">
          PVOIL Vũng Áng Game Show
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 z-10 w-full max-w-6xl px-4">
        
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex justify-center"
        >
          <RoleCard
            title="Dẫn Chương Trình"
            description="Điều khiển trận đấu, quản lý câu hỏi và điểm số."
            href=""
            onClick={() => setShowAuth(true)}
            color="gold"
            icon={<span className="text-5xl">🎤</span>}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex justify-center"
        >
          <RoleCard
            title="Người Chơi"
            description="Tham gia trả lời câu hỏi và giành điểm."
            href="/player/login"
            color="cyan"
            icon={<span className="text-5xl">🎮</span>}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="flex justify-center"
        >
          <RoleCard
            title="Khán Giả"
            description="Theo dõi trực tiếp diễn biến trận đấu."
            href="/guest/screen"
            color="slate"
            icon={<span className="text-5xl">📺</span>}
          />
        </motion.div>
        
      </div>

      <footer className="absolute bottom-8 text-slate-500 text-sm font-mono opacity-50">
        SYSTEM STATUS: ONLINE • SOCKET: ACTIVE
      </footer>

      {/* MC Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-amber-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => {
                   setShowAuth(false);
                   setError("");
                   setPassword("");
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/50">
                    <Lock className="text-amber-500" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Xác Thực MC</h2>
                <p className="text-slate-400 text-sm">Vui lòng nhập mật khẩu quản trị viên</p>
              </div>

              <form onSubmit={handleMCLogin} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                    }}
                    placeholder="Nhập mật khẩu..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 focus:outline-none transition-colors text-center text-lg tracking-widest font-mono"
                    autoFocus
                  />
                  {error && (
                    <p className="text-red-500 text-sm mt-2 text-center animate-pulse">{error}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-bold py-3 rounded-lg transition-all active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                >
                  TRUY CẬP
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
