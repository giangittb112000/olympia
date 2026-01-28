import React from 'react';
import { useGameState } from "@/components/providers/GameStateProvider";
import { useSocketContext } from "@/components/providers/SocketProvider";
import WarmUpMC from './WarmUpMC';
import WarmUpPlayer from './WarmUpPlayer';
import WarmUpMonitor from './WarmUpMonitor';

export default function WarmUpManager({ role }: { role: string }) {
    const { gameState } = useGameState();
    const { socket } = useSocketContext();
    const warmUp = gameState.warmUp;

    if (!warmUp) return (
        <div className="flex flex-col items-center justify-center min-h-screen text-slate-500 gap-4">
            <div className="text-xl">Loading Round Data... (Manager)</div>
            {role === 'mc' && (
                 <button 
                     onClick={() => socket?.emit('mc_set_phase', 'IDLE')}
                     className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2 rounded-lg font-bold border border-slate-600 transition-all"
                 >
                     QUAY VỀ DANH SÁCH
                 </button>
            )}
        </div>
    );

    if (role === 'mc') {
        return <WarmUpMC warmUp={warmUp} />;
    }

    if (role === 'monitor' || role === 'guest') { // 'monitor' or 'guest' based on logic
        return <WarmUpMonitor warmUp={warmUp} />;
    }

    // Default to player
    return <WarmUpPlayer warmUp={warmUp} />;
}
