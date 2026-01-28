import { Server, Socket } from 'socket.io';

import Session from '../../models/Session';

export async function handlePlayerConnection(io: Server, socket: Socket, playerId: string) {
  if (!playerId) {
      console.warn(`[Player Manager] Player connected without ID: ${socket.id}`);
      return;
  }

  // Duplicate Login Check in DB
  // Duplicate Login Check in DB (Find ALL sessions)
  const existingSessions = await Session.find({ role: 'player', playerId });

  if (existingSessions.length > 0) {
    console.log(`[Player Manager] Found ${existingSessions.length} existing sessions for player ${playerId}. Terminating...`);
    for (const session of existingSessions) {
        const oldSocketId = session.socketId;
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
            oldSocket.emit('session_error', 'Tài khoản của bạn đã được đăng nhập ở nơi khác.');
            oldSocket.disconnect(true);
        }
    }
    // Remove stale sessions
    await Session.deleteMany({ role: 'player', playerId });
  }

  // Create new Session
  await Session.create({
      socketId: socket.id,
      role: 'player',
      playerId: playerId
  });

  socket.join('players');
  io.to('mc').emit('player_status', { id: playerId, status: 'online' });
  console.log(`[Player Manager] Player connected: ${playerId} (${socket.id})`);

  socket.on('player_buzz', (data) => {
      // data: { round: 'OBSTACLES' | 'FINISH' }
      import('../../game/GameManager').then(gm => gm.default.handlePlayerBuzz(playerId, data.round));
  });

  socket.on('player_answer_acceleration', (data) => {
      // data: { answer: string, time: number }
      import('../../game/GameManager').then(gm => gm.default.handlePlayerAnswer(playerId, 'ACCELERATION', data));
  });

  socket.on('disconnect', async () => {
    const deleted = await Session.deleteOne({ socketId: socket.id });
    if (deleted.deletedCount > 0) {
        io.to('mc').emit('player_status', { id: playerId, status: 'offline' });
        console.log(`[Player Manager] Player disconnected: ${playerId}`);
    }
  });
}
