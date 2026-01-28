"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useSocketContext } from "@/components/providers/SocketProvider";

interface PlayerScore {
  _id: string;
  name: string;
  scores: {
    total: number;
  };
}

export default function MiniRankingBoard() {
  const { socket } = useSocketContext();
  const [players, setPlayers] = useState<PlayerScore[]>([]);

  const fetchRanking = async () => {
    try {
      const res = await fetch(`/api/players?t=${Date.now()}`, { 
        cache: "no-store",
        headers: { "Pragma": "no-cache", "Cache-Control": "no-cache" }
      });
      const data = await res.json();
      if (data.success) {
        const sorted = (data.data as PlayerScore[]).sort((a, b) => (b.scores?.total || 0) - (a.scores?.total || 0));
        setPlayers(sorted);
      }
    } catch (error) {
      console.error("Failed to fetch ranking", error);
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

  if (players.length === 0) return null;

  return (
    <div className="w-full bg-slate-900/60 border-b border-white/10 fixed top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-start md:justify-center gap-3 overflow-x-auto no-scrollbar pb-1">
            <AnimatePresence mode="popLayout">
                {players.map((player, index) => (
                    <motion.div
                        layout
                        key={player._id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={clsx(
                            "flex items-center gap-3 px-4 py-2 rounded-full border shadow-lg min-w-[160px] md:min-w-0 transition-all",
                            index === 0 ? "bg-amber-950/60 border-amber-500/50 shadow-amber-900/20" : 
                            index === 1 ? "bg-slate-800/60 border-slate-400/30" : 
                            index === 2 ? "bg-orange-900/40 border-orange-700/30" : "bg-slate-900/60 border-white/5"
                        )}
                    >
                         {/* RANK */}
                        <div className={clsx(
                                "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-opacity-50",
                                index === 0 ? "bg-amber-500 text-black ring-amber-300" :
                                index === 1 ? "bg-slate-300 text-black ring-slate-100" :
                                index === 2 ? "bg-orange-600 text-white ring-orange-400" : "bg-slate-700 text-slate-400 ring-slate-600"
                            )}>
                                {index + 1}
                        </div>

                        {/* INFO */}
                        <div className="flex flex-col md:flex-row md:items-baseline md:gap-2">
                            <span className={clsx(
                                "text-xs md:text-sm font-bold truncate max-w-[80px] md:max-w-none", 
                                index === 0 ? "text-amber-300" : "text-slate-200"
                            )}>
                                {player.name}
                            </span>
                            <span className={clsx(
                                "text-sm md:text-base font-mono font-black leading-none",
                                index === 0 ? "text-amber-500" : "text-white"
                            )}>
                                {player.scores?.total || 0}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
