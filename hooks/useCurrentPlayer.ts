import { useState, useEffect } from 'react';

/**
 * Hook to retrieve the authenticated Player ID from persistent storage.
 * Use this across all game rounds to identify the current user.
 */
export function useCurrentPlayer() {
    const [playerId, setPlayerId] = useState<string | null>(null);

    useEffect(() => {
        // Retrieve from localStorage (set during Login)
        // We use an interval or event listener if we wanted realtime updates on login/logout,
        // but typically this doesn't change during gameplay.
        // For HMR safety, we check immediately.
        const storedId = localStorage.getItem('olympia_player_id');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPlayerId(storedId);

        // Optional: Listen for storage events if multi-tab support is needed,
        // but not strictly required for this simple app.
    }, []);

    return playerId;
}
