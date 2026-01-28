"use client";

import { useSocket } from "./useSocket";

export const usePlayerSocket = (playerId: string) => {
  return useSocket({ role: "player", id: playerId });
};
