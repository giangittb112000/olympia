"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import io, { type Socket } from "socket.io-client";

interface SocketOptions {
  role?: "mc" | "player" | "guest" | "monitor";
  id?: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: (options: SocketOptions) => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
});

export const useSocketContext = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Ref to track current connection params to avoid duplicate connections
  const currentOptions = useRef<SocketOptions | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connect = (options: SocketOptions) => {
    // Check against Ref (synchronous)
    if (
      socketRef.current && 
      currentOptions.current?.role === options.role && 
      currentOptions.current?.id === options.id
    ) {
      console.log("[SocketProvider] Already connected with same options (Ref Check), skipping.");
      return;
    }

    console.log("[SocketProvider] Connecting with options:", options);

    // Disconnect existing if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socketInstance = io(process.env.SOCKET_URL || "http://localhost:3000", {
      path: "/socket.io",
      query: {
        role: options.role || "guest",
        id: options.id || "",
      },
      reconnection: true,
      reconnectionAttempts: 5, 
    });

    socketInstance.on("connect", () => {
      console.log("[SocketProvider] Connected:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("[SocketProvider] Disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
        console.error("[SocketProvider] Connection error:", err);
        setIsConnected(false);
    });

    socketInstance.on("force_redirect", (path: string) => {
        console.warn(`[SocketProvider] Received force redirect to: ${path}`);
        socketInstance.disconnect(); 
        // alert("Session Rejected: Another MC is already active."); // Removing blocking alert
        window.location.href = path; 
    });

    socketInstance.on("session_error", (msg: string) => {
        console.error(`[SocketProvider] Session Error: ${msg}`);
        alert(msg);
        socketInstance.disconnect();
        window.location.href = "/player/login"; // Force redirect to login
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);
    currentOptions.current = options;
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      currentOptions.current = null;
    }
  };

  // Cleanup on unmount (only when the entire app unmounts)
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  return (
    <SocketContext.Provider value={{ socket, isConnected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
}
