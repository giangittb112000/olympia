"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSocketContext } from "@/components/providers/SocketProvider";

interface Player {
  _id: string;
  name: string;
}

export default function PlayerLoginPage() {
  const router = useRouter();
  const { connect, isConnected, socket } = useSocketContext();
  const [offlinePlayers, setOfflinePlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Auth State
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Fetch offline players
  useEffect(() => {
    fetch("/api/players?status=offline")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOfflinePlayers(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectIdentity = (player: Player) => {
    setSelectedPlayer(player);
    setPassword("");
    setAuthError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer || !password) return;

    setAuthLoading(true);
    setAuthError("");

    try {
        const res = await fetch('/api/players/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: selectedPlayer._id, password })
        });
        const data = await res.json();

        if (data.success && data.valid) {
            // Connect socket with player role
            connect({ role: "player", id: selectedPlayer._id });
            
            // Persist ID for game rounds to identify user
            localStorage.setItem('olympia_player_id', selectedPlayer._id);
            
            // Redirect handled in useEffect below
        } else {
            setAuthError(data.error || "Mật khẩu không đúng");
        }
    } catch {
        setAuthError("Lỗi kết nối server");
    } finally {
        setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && socket) {
        router.push("/player/waiting");
    }
  }, [isConnected, socket, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        <h1 className="text-3xl font-bold text-center text-amber-500 mb-8 font-mono">
          XÁC THỰC DANH TÍNH
        </h1>

        {loading ? (
            <div className="text-center text-cyan-500 animate-pulse">Đang tải dữ liệu...</div>
        ) : selectedPlayer ? (
             /* PASSWORD PROMPT MODAL/FORM */
             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 border border-amber-500/50 p-8 rounded-xl max-w-md mx-auto"
             >
                <h2 className="text-xl text-white mb-4 text-center">
                    Xin chào, <span className="font-bold text-amber-500">{selectedPlayer.name}</span>
                </h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập mật khẩu..."
                            className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-amber-500"
                            autoFocus
                        />
                    </div>
                    {authError && (
                        <div className="text-red-500 text-sm text-center font-bold">
                            {authError}
                        </div>
                    )}
                    <div className="flex gap-4">
                        <button 
                            type="button"
                            onClick={() => setSelectedPlayer(null)}
                            className="flex-1 bg-slate-800 text-slate-400 py-3 rounded-lg font-bold hover:bg-slate-700"
                        >
                            QUAY LẠI
                        </button>
                        <button 
                            type="submit"
                            disabled={authLoading}
                            className="flex-1 bg-amber-600 text-white py-3 rounded-lg font-bold hover:bg-amber-500 disabled:opacity-50"
                        >
                            {authLoading ? "ĐANG CHECK..." : "ĐĂNG NHẬP"}
                        </button>
                    </div>
                </form>
             </motion.div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {offlinePlayers.length === 0 ? (
                    <div className="col-span-full text-center text-slate-500">
                        Không tìm thấy danh tính khả dụng.
                    </div>
                ) : (
                    offlinePlayers.map((player) => (
                        <motion.button
                            key={player._id}
                            whileHover={{ scale: 1.05, borderColor: '#f59e0b' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSelectIdentity(player)}
                            className="bg-slate-900 border border-slate-700 p-6 rounded-lg text-slate-200 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                        >
                            <div className="text-xl font-bold truncate">{player.name}</div>
                            <div className="text-xs text-slate-600 mt-2 uppercase">MÃ: {player._id.slice(-4)}</div>
                        </motion.button>
                    ))
                )}
            </div>
        )}
      </motion.div>
    </div>
  );
}
