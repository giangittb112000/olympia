"use client";

import { useGameState } from "@/components/providers/GameStateProvider";
import { useSocketContext } from "@/components/providers/SocketProvider";
import FinishLineMC from "./FinishLineMC";
import FinishLinePlayer from "./FinishLinePlayer";
import FinishLineMonitor from "./FinishLineMonitor";

export default function FinishLineManager({ role }: { role: string }) {
  const { gameState } = useGameState();
  const { socket } = useSocketContext();
  const finishLine = gameState.finishLine;

  if (!finishLine) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-500 gap-4">
        <div className="text-xl">Loading Finish Line Round...</div>
        {role === "mc" && (
          <button
            onClick={() => socket?.emit("mc_set_phase", "IDLE")}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2 rounded-lg font-bold border border-slate-600 transition-all"
          >
            QUAY VỀ DASHBOARD
          </button>
        )}
      </div>
    );
  }

  if (role === "mc") {
    return <FinishLineMC finishLine={finishLine} />;
  }

  if (role === "monitor" || role === "guest") {
    return <FinishLineMonitor finishLine={finishLine} />;
  }

  // Default to player
  return <FinishLinePlayer finishLine={finishLine} />;
}
