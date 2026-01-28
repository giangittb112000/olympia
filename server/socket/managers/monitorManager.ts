import { Server, Socket } from 'socket.io';

import Session from '../../models/Session';

export function handleMonitorConnection(io: Server, socket: Socket) {
    socket.join('monitors');

    // Handle request for status
    socket.on('request_system_status', async () => {
        // Query DB for MC session status
        const mcSessionDoc = await Session.findOne({ role: 'mc' });
        let mcConnected = false;
        
        if (mcSessionDoc) {
             const mcSocket = io.sockets.sockets.get(mcSessionDoc.socketId);
             // Verify if socket actually exists in IO (double check), though DB should be source of truth
             mcConnected = !!(mcSocket && mcSocket.connected);
        }
        
        // Get active players from DB
        const playerSessions = await Session.find({ role: 'player' }).populate('playerId', 'name');
        const onlinePlayers = playerSessions.map(sess => sess.playerId?.name || sess.playerId?.toString());
        
        // Guest count (still use room size as we don't track guests in DB individually unless we want to)
        const guestRoom = io.sockets.adapter.rooms.get('guests');
        const guestCount = guestRoom ? guestRoom.size : 0;

        // Broadcasting/Emitting back
        socket.emit('system_status', {
            mcConnected,
            mcSocketId: mcConnected ? mcSessionDoc?.socketId : undefined,
            onlinePlayers: onlinePlayers,
            guestCount
        });
    });
}
