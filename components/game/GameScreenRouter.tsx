"use client";

import { useGameState } from "@/components/providers/GameStateProvider";
import { useSocketContext } from "@/components/providers/SocketProvider";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import WarmUpRound from "./rounds/warmup/WarmUpManager";
import ObstaclesRound from "./rounds/obstacles/ObstaclesManager";
import AccelerationRound from "./rounds/acceleration/AccelerationManager";
import FinishLineRound from "./rounds/finishline/FinishLineManager";
import PlayerHeader from "./PlayerHeader";
import TutorialVideoPlayer from "./TutorialVideoPlayer";

interface GameScreenRouterProps {
    children: React.ReactNode; // Default content (Idle/Waiting screen)
}

export function GameScreenRouter({ children }: GameScreenRouterProps) {
    const { gameState } = useGameState();
    const { socket } = useSocketContext();
    const [role, setRole] = useState<string>("guest");

    useEffect(() => {
        if (socket?.io?.opts?.query) {
             // eslint-disable-next-line @typescript-eslint/ban-ts-comment
             // @ts-ignore
             const r = socket.io.opts.query.role || "guest";
             // eslint-disable-next-line react-hooks/set-state-in-effect
             setRole(r as string);
        }
    }, [socket]);

    // Debug State Sync
    useEffect(() => {
        console.log(`[Router] Current Role: ${role}, Phase: ${gameState.phase}`);
    }, [role, gameState.phase]);

    // Determine what to render based on phase
    const renderContent = () => {
        switch (gameState.phase) {
            case 'WARMUP':
                return <WarmUpRound role={role} />;
            case 'OBSTACLES':
                return <ObstaclesRound role={role} />;
            case 'ACCELERATION':
                return <AccelerationRound role={role} />;
            case 'FINISH':
                return <FinishLineRound role={role} />;
            case 'IDLE':
            default:
                return children;
        }
    };

    return (
        <>
            {role === 'player' && <PlayerHeader />}
            <TutorialVideoPlayer role={role} />
            
            <AnimatePresence mode="wait">
                <motion.div
                    key={gameState.phase}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full"
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </>
    );
}
