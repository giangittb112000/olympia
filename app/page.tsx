"use client";

import { RoleCard } from "@/components/ui/RoleCard";
import { motion } from "framer-motion";

export default function Home() {
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
            href="/mc/dashboard"
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
    </main>
  );
}
