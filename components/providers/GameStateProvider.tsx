"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocketContext } from "@/components/providers/SocketProvider";

// Duplicate type locally to avoid importing server code in client (Next.js rule)
// Ideally, we move GameState to a shared 'types' folder. 
// For now, I will redefine it here to be safe and strictly typed.
export type ClientGamePhase = 
  | 'IDLE'          
  | 'WARMUP'        
  | 'OBSTACLES'     
  | 'ACCELERATION'  
  | 'FINISH';

import { AccelerationState, FinishLineState, ObstacleState, WarmUpState } from "@/server/game/GameConstants";

export interface ClientGameState {
  phase: ClientGamePhase;
  roundId?: string;
  activePlayerId?: string;
  timestamp: number;
  
  // Round Specific Data
  warmUp?: WarmUpState;
  obstacle?: ObstacleState;
  acceleration?: AccelerationState;
  // finish?: FinishState; // Removed
  finishLine?: FinishLineState; // New finish line round
}

interface GameStateContextType {
  gameState: ClientGameState;
}

const GameStateContext = createContext<GameStateContextType>({
  gameState: { phase: 'IDLE', timestamp: 0 },
});

export const useGameState = () => useContext(GameStateContext);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocketContext();
  const [gameState, setGameState] = useState<ClientGameState>({ 
      phase: 'IDLE', 
      timestamp: 0 
  });

  useEffect(() => {
    if (!socket) return;

    // Listen for state sync
    socket.on("gamestate_sync", (state: ClientGameState) => {
      console.log("[GameState] Synced:", state);
      setGameState(state);
    });

    return () => {
      socket.off("gamestate_sync");
    };
  }, [socket]);

  return (
    <GameStateContext.Provider value={{ gameState }}>
      {children}
    </GameStateContext.Provider>
  );
}
