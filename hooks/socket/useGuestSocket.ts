"use client";

import { useSocket } from "./useSocket";

export const useGuestSocket = () => {
  return useSocket({ role: "guest" });
};
