import { Server, Socket } from 'socket.io';

import Session from '../../models/Session';

export async function handleMCConnection(io: Server, socket: Socket) {
  // Check DB for existing MC session
  const existingSession = await Session.findOne({ role: 'mc' });

  if (existingSession) {
    // Check if the existing socket is still connected
    const oldSocket = io.sockets.sockets.get(existingSession.socketId);
    
    if (oldSocket && oldSocket.connected) {
      console.log(`[MC Manager] Rejecting new MC connection: ${socket.id} (Existing: ${existingSession.socketId})`);
      socket.emit('force_redirect', '/');
      
      setTimeout(() => {
        socket.disconnect(true);
      }, 500);
      return; 
    } else {
        // Stale session in DB (server restart or cleared), remove it
        await Session.deleteOne({ _id: existingSession._id });
    }
  }

  // Create new Session
  await Session.create({
      socketId: socket.id,
      role: 'mc',
  });

  socket.join('mc');
  console.log(`[MC Manager] MC connected: ${socket.id}`);

  // Actions
  socket.on('mc_refresh_ranking', () => {
      io.emit('refresh_ranking');
      console.log('[MC Manager] Broadcasting ranking refresh');
  });

  socket.on('mc_play_video', (data: { url: string }) => {
      io.emit('play_tutorial_video', data);
      console.log(`[MC Manager] Broadcasting video play: ${data.url}`);
  });

  socket.on('mc_stop_video', () => {
      io.emit('stop_tutorial_video');
      console.log(`[MC Manager] Broadcasting video stop`);
  });

  socket.on('disconnect', async () => {
    // Remove from DB on disconnect
    const deleted = await Session.deleteOne({ socketId: socket.id });
    if (deleted.deletedCount > 0) {
        console.log(`[MC Manager] MC disconnected and removed from DB: ${socket.id}`);
    }
  });
}
