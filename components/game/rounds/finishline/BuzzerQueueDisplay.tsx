"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Zap } from "lucide-react";

interface BuzzerQueueDisplayProps {
  queue: {
    playerId: string;
    playerName: string;
    buzzTime: number;
  }[];
}

export default function BuzzerQueueDisplay({ queue }: BuzzerQueueDisplayProps) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-gradient-to-br from-orange-900/50 to-red-900/50 backdrop-blur-md border-4 border-orange-500 rounded-3xl p-4 shadow-2xl h-full flex flex-col"
    >
      <div className="flex items-center gap-3 mb-4 border-b border-orange-500/30 pb-2">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          <Bell size={32} className="text-orange-400" />
        </motion.div>
        <h3 className="text-xl font-black text-orange-400 uppercase tracking-wider">
          Chuông
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative min-h-[100px]">
        <AnimatePresence mode="popLayout">
          {queue.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-4xl mb-2"
              >
                ⏳
              </motion.div>
              <p className="text-sm text-slate-400 font-mono uppercase">Waiting...</p>
            </motion.div>
          ) : (
            queue.map((buzz, idx) => (
              <motion.div
                key={buzz.playerId}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ type: "spring", delay: idx * 0.1 }}
                className="bg-slate-900/80 border-2 border-orange-600 rounded-xl p-3 mb-2 flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl filter drop-shadow-md">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                  </span>
                  <div>
                    <div className="text-lg font-black text-white leading-tight">
                      {buzz.playerName}
                    </div>
                    <div className="text-xs text-orange-200/70 font-mono">
                      {buzz.buzzTime.toFixed(3)}s
                    </div>
                  </div>
                </div>
                {idx === 0 && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <Zap size={24} className="text-yellow-500" fill="currentColor" />
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
