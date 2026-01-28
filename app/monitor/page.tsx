"use client";
import { useSocket } from "@/hooks/socket/useSocket";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface SystemStats {
  mcConnected: boolean;
  mcSocketId?: string;
  onlinePlayers: string[]; // List of names or IDs
  guestCount: number;
}

export default function MonitorPage() {
  const socket = useSocket({ role: "monitor" }); 
  const [stats, setStats] = useState<SystemStats>({
    mcConnected: false,
    onlinePlayers: [],
    guestCount: 0,
  });

  useEffect(() => {
    if (!socket) return;

    // We need to implement 'system_status' event on server
    socket.on("system_status", (data: SystemStats) => {
        setStats(data);
    });
    
    // Fallback/Legacy listeners
    socket.on("player_status", () => {
        // Trigger a refresh request if needed
        socket.emit("request_system_status");
    });

    // Initial request
    socket.emit("request_system_status");

    return () => {
      socket.off("system_status");
      socket.off("player_status");
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-black text-green-500 p-8 font-mono">
      <h1 className="text-3xl font-bold mb-8 border-b border-green-900 pb-2">HỆ THỐNG GIÁM SÁT</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* MC STATUS */}
        <div className="border border-green-800 p-6 rounded bg-green-900/10">
            <h2 className="text-xl mb-4">TRẠNG THÁI MC</h2>
            <div className={`text-4xl font-bold ${stats.mcConnected ? 'text-green-400' : 'text-red-500'}`}>
                {stats.mcConnected ? 'KẾT NỐI' : 'MẤT KẾT NỐI'}
            </div>
            {stats.mcConnected && <div className="text-xs mt-2 opacity-50">SOCKET ID: {stats.mcSocketId}</div>}
        </div>

        {/* GUEST COUNT */}
        <div className="border border-green-800 p-6 rounded bg-green-900/10">
            <h2 className="text-xl mb-4">SỐ LƯỢNG KHÁN GIẢ</h2>
            <div className="text-4xl font-bold text-blue-400">
                {stats.guestCount}
            </div>
        </div>

        {/* PLAYER LIST */}
        <div className="md:col-span-2 border border-green-800 p-6 rounded bg-green-900/10">
            <h2 className="text-xl mb-4">NGƯỜI CHƠI TRỰC TUYẾN ({stats.onlinePlayers.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.onlinePlayers.map((player, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-green-900/30 p-2 rounded text-center border border-green-700/50"
                    >
                        {player}
                    </motion.div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}
