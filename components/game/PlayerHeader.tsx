"use client";

import { useSocketContext } from "@/components/providers/SocketProvider";
import { useEffect, useState } from "react";

interface Player {
  _id: string;
  name: string;
}

export default function PlayerHeader() {
  const { socket } = useSocketContext();
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    if (!socket?.io?.opts?.query) return;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const role = socket.io.opts.query.role;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const id = socket.io.opts.query.id;

    if (role === "player" && id) {
      // Fetch player info
      fetch(`/api/players/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setPlayer(data.data);
          }
        })
        .catch((err) => console.error("Failed to fetch player info", err));
    }
  }, [socket]);

  if (!player) return null;

  return (
    <div className="fixed top-4 left-4 z-50 bg-slate-900/80 border border-amber-500/50 rounded-lg px-4 py-2 flex items-center gap-3 shadow-lg backdrop-blur">
      <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-black font-bold text-sm">
        {player.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <div className="text-xs text-slate-400 uppercase">Thí sinh</div>
        <div className="text-amber-400 font-bold leading-none">{player.name}</div>
      </div>
    </div>
  );
}
