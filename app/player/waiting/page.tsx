"use client";

import { useSocketContext } from "@/components/providers/SocketProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { GameScreenRouter } from "@/components/game/GameScreenRouter";
import RankingBoard from "@/components/game/RankingBoard";
import { useGameState } from "@/components/providers/GameStateProvider";

export default function PlayerWaitingPage() {
    return (
        <GameScreenRouter>
            <WaitingContent />
        </GameScreenRouter>
    );
}

function WaitingContent() {
    const { isConnected } = useSocketContext();
    const { gameState } = useGameState();
    const router = useRouter();

    useEffect(() => {
        if (!isConnected) {
            router.push("/player/login");
        }
    }, [isConnected, router]);

    // If game is active (not IDLE/WARMUP/FINISH?), usually GameScreenRouter redirects.
    // But if we are in WAITING phase or just default.
    
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
             <div className="mb-8 text-center">
                <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-block"
                >
                    <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                </motion.div>
                <h1 className="text-2xl font-bold text-amber-500 font-mono tracking-widest">
                    Đang chờ MC bắt đầu...
                </h1>
             </div>

             {/* Show Ranking Board if in IDLE or simple waiting state */}
             <div className="w-full max-w-4xl">
                <h2 className="text-center text-amber-700 font-bold mb-4 uppercase tracking-widest text-sm">Bảng Xếp Hạng Tạm Thời</h2>
                <RankingBoard />
             </div>
        </div>
    );
}
