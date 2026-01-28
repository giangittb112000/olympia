import React from 'react';
import { useGameState } from "@/components/providers/GameStateProvider";
import { useSocketContext } from "@/components/providers/SocketProvider";
import AccelerationMC from './AccelerationMC';
import AccelerationPlayer from './AccelerationPlayer';
import AccelerationMonitor from './AccelerationMonitor';

export default function AccelerationManager({ role }: { role: string }) {
    const { gameState } = useGameState();
    const { socket } = useSocketContext();
    const acceleration = gameState.acceleration;

    if (!acceleration) return (
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
        return <AccelerationMC acceleration={acceleration} />;
    }

    if (role === 'monitor' || role === 'guest') {
        return <AccelerationMonitor acceleration={acceleration} />;
    }

    // Default to player
    return <AccelerationPlayer acceleration={acceleration} />;
}
