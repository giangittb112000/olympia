"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useSocketContext } from "@/components/providers/SocketProvider";

interface PlayerScore {
  _id: string;
  name: string;
  scores: {
    warmup: number;
    obstacles: number;
    acceleration: number;
    finish: number;
    total: number;
  };
}

export default function RankingBoard() {
  const { socket } = useSocketContext();
  const [players, setPlayers] = useState<PlayerScore[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanking = async () => {
    try {
      const res = await fetch("/api/players");
      const data = await res.json();
      if (data.success) {
        const sorted = (data.data as PlayerScore[]).sort((a, b) => (b.scores?.total || 0) - (a.scores?.total || 0));
        setPlayers(sorted);
      }
    } catch (error) {
      console.error("Failed to fetch ranking", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
    if (socket) {
        socket.on('refresh_ranking', fetchRanking);
    }
    return () => {
        socket?.off('refresh_ranking', fetchRanking);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      {/* Container with Glassmorphism and Cinematic Glow */}
      <div className="relative bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.15)] ring-1 ring-white/10">
        
        {/* Background Decorative Gradients */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
        
        {/* HEADER */}
        <div className="relative p-8 border-b border-white/10 text-center bg-gradient-to-r from-transparent via-slate-900/50 to-transparent">
            <h2 className="text-4xl md:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 uppercase tracking-[0.2em] drop-shadow-sm">
                Bảng Tổng Sắp
            </h2>
             <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-4 rounded-full opacity-75"></div>
        </div>

        {/* TABLE HEADER */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-900/50 border-b border-white/5 text-slate-400 font-mono text-xs md:text-sm uppercase tracking-wider items-center">
            <div className="col-span-2 text-center">Hạng</div>
            <div className="col-span-7">Thí Sinh</div>
            <div className="col-span-3 text-right pr-4">Tổng Điểm</div>
        </div>

        {/* LIST */}
        <div className="p-4 space-y-3">
            <AnimatePresence>
                {players.map((player, index) => (
                    <motion.div
                        layout
                        key={player._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className={clsx(
                            "grid grid-cols-12 gap-4 p-4 rounded-2xl items-center relative overflow-hidden group border transition-all duration-300",
                            index === 0 ? "bg-gradient-to-r from-amber-950/40 to-slate-900/40 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.1)]" : 
                            index === 1 ? "bg-gradient-to-r from-slate-800/40 to-slate-900/40 border-slate-400/30" : 
                            index === 2 ? "bg-gradient-to-r from-orange-950/40 to-slate-900/40 border-orange-700/30" : 
                            "bg-slate-900/40 border-white/5 hover:bg-white/5 hover:border-white/10"
                        )}
                    >
                         {/* Shine Effect for Top 1 */}
                         {index === 0 && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent skew-x-12 translate-x-[-100%] animate-shine pointer-events-none" />}

                         {/* RANK */}
                        <div className="col-span-2 flex justify-center relative z-10">
                            <div className={clsx(
                                "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black text-xl md:text-2xl shadow-lg border-2",
                                index === 0 ? "bg-gradient-to-br from-amber-300 to-amber-600 border-amber-200 text-white shadow-amber-500/40" :
                                index === 1 ? "bg-gradient-to-br from-slate-200 to-slate-500 border-slate-300 text-slate-900" :
                                index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-700 border-orange-300 text-white" : 
                                "bg-slate-800 border-slate-700 text-slate-500"
                            )}>
                                {index + 1}
                            </div>
                        </div>

                        {/* NAME */}
                        <div className="col-span-7 relative z-10">
                            <h3 className={clsx(
                                "font-bold text-lg md:text-2xl font-display tracking-tight truncate",
                                index === 0 ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-sm" : 
                                index === 1 ? "text-slate-200" :
                                index === 2 ? "text-orange-200" : "text-slate-300"
                            )}>
                                {player.name}
                            </h3>
                            {index === 0 && <div className="text-xs text-amber-500 font-mono tracking-widest uppercase mt-0.5">Dẫn đầu</div>}
                        </div>
                        
                        {/* TOTAL SCORE */}
                        <div className="col-span-3 text-right pr-4 relative z-10">
                            <div className={clsx(
                                "font-mono font-black text-3xl md:text-4xl",
                                index === 0 ? "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" : 
                                "text-white opacity-90"
                            )}>
                                {player.scores?.total || 0}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            
            {players.length === 0 && !loading && (
                <div className="text-center py-16 text-slate-600 font-light italic">
                    Chưa có dữ liệu thí sinh
                </div>
            )}
        </div>
        
        {/* FOOTER */}
        <div className="bg-slate-950/80 p-4 border-t border-white/5 text-center relative overflow-hidden">
             <div className="relative z-10 text-[10px] md:text-xs text-slate-600 font-mono uppercase tracking-[0.3em]">
                Hệ thống cập nhật thời gian thực
             </div>
        </div>

      </div>
    </div>
  );
}
