import { Server, Socket } from 'socket.io';

export function handleGuestConnection(io: Server, socket: Socket) {
  socket.join('guests');
  console.log(`[Guest Manager] Guest joined: ${socket.id}`);
}
