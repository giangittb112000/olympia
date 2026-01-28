"use client";
import RankingBoard from "@/components/game/RankingBoard";
import { GameScreenRouter } from "@/components/game/GameScreenRouter";
import { useGuestSocket } from "@/hooks/socket/useGuestSocket";
import { motion } from "framer-motion";
import { useGameState } from "@/components/providers/GameStateProvider";
import MiniRankingBoard from "@/components/game/MiniRankingBoard";

export default function GuestScreenPage() {
  useGuestSocket(); // Trigger connection
  const { gameState } = useGameState();

  return (
    <div className="relative min-h-screen bg-slate-950">
       {/* Show Mini Ranking in Active Phases (Not IDLE) */}
       {gameState.phase !== 'IDLE' && <MiniRankingBoard />}

       {/* Router handles the main content: Big Ranking (IDLE) or Round Game (Active) */}
       <GameScreenRouter>
            {/* IDLE CONTENT (Passed as children to Router) */}
             <div className="flex min-h-screen flex-col items-center justify-center p-8 text-slate-200">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-6xl"
                >
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-bold mb-2 text-amber-500 font-display uppercase tracking-widest drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                            Đường Lên Đỉnh Olympia
                        </h1>
                        <p className="text-slate-400 font-light tracking-wide">CHÀO MỪNG QUÝ KHÁN GIẢ</p>
                    </div>
                    
                    <RankingBoard />
                </motion.div>
            </div>
       </GameScreenRouter>
    </div>
  );
}

function GuestInternalContent() {
    // Legacy placeholder, logic moved up
    return null; 
}
