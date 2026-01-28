"use client";

import { useEffect } from "react";
import { useSocketContext } from "@/components/providers/SocketProvider";

export interface UseSocketOptions {
  role?: "mc" | "player" | "guest" | "monitor";
  id?: string;
}

export const useSocket = (options?: UseSocketOptions) => {
  const { socket, connect } = useSocketContext();

  useEffect(() => {
    // Determine default options if none provided
    const finalOptions = options || { role: "guest" };
    connect(finalOptions);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.role, options?.id]); 

  return socket;
};
