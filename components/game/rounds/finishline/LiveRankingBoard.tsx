"use client";
import { motion } from "framer-motion";
import { Trophy, Medal, Award } from "lucide-react";

interface Player {
  _id: string;
  name: string;
  scores?: {
    total: number;
  };
}

interface LiveRankingBoardProps {
  players?: Player[];
  compact?: boolean;
}

export default function LiveRankingBoard({
  players = [],
  compact = false,
}: LiveRankingBoardProps) {
  // Safe sort
  const sortedPlayers = [...players].sort((a, b) => (b.scores?.total || 0) - (a.scores?.total || 0));

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={compact ? 32 : 48} className="text-yellow-500" />;
      case 2:
        return <Medal size={compact ? 32 : 48} className="text-slate-400" />;
      case 3:
        return <Award size={compact ? 32 : 48} className="text-amber-700" />;
      default:
        return null;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "from-yellow-600/30 to-amber-700/30 border-yellow-500";
      case 2:
        return "from-slate-600/30 to-slate-700/30 border-slate-400";
      case 3:
        return "from-amber-700/30 to-orange-800/30 border-amber-600";
      default:
        return "from-slate-800/30 to-slate-900/30 border-slate-600";
    }
  };

  return (
    <div
      className={`bg-slate-900/30 backdrop-blur-md border-2 border-purple-500 rounded-3xl ${
        compact ? "p-4" : "p-8"
      } h-full overflow-hidden flex flex-col`}
    >
      <h2
        className={`${
          compact ? "text-xl" : "text-4xl"
        } font-black text-purple-400 mb-4 text-center uppercase tracking-widest`}
      >
        🏆 Bảng Xếp Hạng
      </h2>

      <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
        {sortedPlayers.map((player, idx) => (
          <motion.div
            key={player._id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-gradient-to-r ${getRankBg(
              idx + 1
            )} border rounded-2xl ${compact ? "p-3" : "p-6"} flex items-center justify-between shadow-lg`}
          >
            <div className="flex items-center gap-4">
              {getMedalIcon(idx + 1) || (
                <span
                  className={`${
                    compact ? "w-8 h-8 text-xl" : "w-16 h-16 text-3xl"
                  } flex items-center justify-center bg-slate-800 rounded-full font-black text-white`}
                >
                  {idx + 1}
                </span>
              )}
              <div className="min-w-0">
                <div
                  className={`${
                    compact ? "text-lg" : "text-3xl"
                  } font-black text-white truncate`}
                >
                  {player.name}
                </div>
                {!compact && idx === 0 && (
                  <div className="text-sm text-yellow-400 font-bold">
                    🎯 ĐANG DẪN ĐẦU
                  </div>
                )}
              </div>
            </div>
            <div
              className={`${
                compact ? "text-2xl" : "text-5xl"
              } font-black ${
                idx === 0 ? "text-yellow-400" : "text-white"
              }`}
            >
              {player.scores?.total || 0}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
