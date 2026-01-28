import React from 'react';
import { useGameState } from "@/components/providers/GameStateProvider";
import { useSocketContext } from "@/components/providers/SocketProvider";
import ObstaclesMC from './ObstaclesMC';
import ObstaclesPlayer from './ObstaclesPlayer';
import ObstaclesMonitor from './ObstaclesMonitor';

export default function ObstaclesManager({ role }: { role: string }) {
    const { gameState } = useGameState();
    const { socket } = useSocketContext();
    const obstacle = gameState.obstacle;

    if (!obstacle) return (
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
        return <ObstaclesMC obstacle={obstacle} />;
    }

    if (role === 'monitor' || role === 'guest') {
        return <ObstaclesMonitor obstacle={obstacle} />;
    }

    // Default to player
    return <ObstaclesPlayer obstacle={obstacle} />;
}
