import { useState, useEffect } from 'react';
import { useSocketContext } from '@/components/providers/SocketProvider';

export interface Player {
    _id: string;
    name: string;
    pin: string;
    scores: {
        total: number;
        warmup: number;
        obstacle: number;
        acceleration: number;
        finish: number;
    };
    status?: 'online' | 'offline';
}

export function usePlayers() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocketContext();

    const fetchPlayers = async () => {
        try {
            const res = await fetch('/api/players');
            const data = await res.json();
            if (data.success) {
                setPlayers(data.data || []);
            }
        } catch (e) {
            console.error("Failed to fetch players", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlayers();

        // Listen for updates
        if (socket) {
            socket.on('player_registered', fetchPlayers);
            socket.on('player_status', fetchPlayers); // Online/Offline
            socket.on('refresh_ranking', fetchPlayers); // Score updates
        }

        return () => {
            if (socket) {
                socket.off('player_registered', fetchPlayers);
                socket.off('player_status', fetchPlayers);
                socket.off('refresh_ranking', fetchPlayers);
            }
        };
    }, [socket]);

    return { players, loading, refetch: fetchPlayers };
}
