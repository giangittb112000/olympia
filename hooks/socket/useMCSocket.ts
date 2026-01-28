"use client";

import { useSocket } from "./useSocket";

export const useMCSocket = () => {
  return useSocket({ role: "mc" });
};
