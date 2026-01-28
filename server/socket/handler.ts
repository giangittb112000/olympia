import { Server, Socket } from 'socket.io';
import { handleMCConnection } from './managers/mcManager';
import { handlePlayerConnection } from './managers/playerManager';
import { handleGuestConnection } from './managers/guestManager';
import { handleMonitorConnection } from './managers/monitorManager';
import { warmUpManager } from './managers/warmUpManager';
import { obstacleManager } from './managers/obstacleManager';
import { registerAccelerationHandlers } from './managers/accelerationManager';
import { registerFinishLineHandlers } from './managers/finishLineManager';
import gameManager from '../game/GameManager';

export function setupSocketHandlers(io: Server) {
  // Initialize Game Manager with IO instance
  gameManager.setIO(io);

  io.on('connection', (socket: Socket) => {
    const role = socket.handshake.query.role as string;
    const playerId = socket.handshake.query.id as string;

    console.log(`[Socket] Connection attempt: ${socket.id} | Role: ${role} | ID: ${playerId || 'N/A'}`);

    // Initial State Sync (Critical for F5/Reconnect)
    socket.emit('gamestate_sync', gameManager.getState());

    switch (role) {
      case 'mc':
        handleMCConnection(io, socket);
        warmUpManager(io, socket);
        obstacleManager(io, socket); // Register Obstacle Handlers
        registerAccelerationHandlers(io, socket); // Register Acceleration Handlers
        registerFinishLineHandlers(io, socket); // ✅ Register Finish Line Handlers
        socket.on('mc_set_phase', async (phase) => {
            console.log(`[Socket DEBUG] MC set phase to: ${phase}`);
            try {
                gameManager.setPhase(phase);
                
                if (phase === 'OBSTACLES') {
                    try {
                        const ObstacleResource = (await import('../models/ObstacleResource')).default;
                        // Find latest resource
                        const resource = await ObstacleResource.findOne().sort({ createdAt: -1 });
                        
                        if (resource) {
                             // Mark as IN_PROGRESS if not already
                            if (resource.status === 'NOT_STARTED') {
                                resource.status = 'IN_PROGRESS';
                                await resource.save();
                                console.log(`[Socket] Marked Obstacle Resource ${resource.name} as IN_PROGRESS`);
                            }

                             gameManager.updateObstacleState({
                                 currentImage: resource.image,
                                 finalCNV: resource.finalCNV,
                                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                 rowLengths: resource.rows.map((row: any) => row.answer.length),
                                 rowContents: resource.rows.map(() => ""),
                                 status: 'IDLE' 
                             });
                             console.log(`[Socket] Loaded Obstacle Resource: ${resource.name} | Image: ${resource.image}`);
                        } else {
                            console.warn('[Socket] No Obstacle Resource found!');
                        }
                    } catch (err) {
                        console.error('[Socket] Failed to load obstacle resource:', err);
                    }
                }

                console.log(`[Socket DEBUG] GameManager updated phase to ${phase}`);
            } catch (e) {
                console.error(`[Socket ERROR] Failed to set phase:`, e);
            }
        });

        socket.on('mc_update_warmup', (data) => {
            console.log(`[Socket DEBUG] MC update warmUp:`, data);
            gameManager.updateWarmUpState(data);
        });

        socket.on('mc_update_obstacle', (data) => {
            console.log(`[Socket DEBUG] MC update obstacle:`, data);
            gameManager.updateObstacleState(data);
        });

        socket.on('mc_update_acceleration', (data) => {
            console.log(`[Socket DEBUG] MC update acceleration:`, data);
            gameManager.updateAccelerationState(data);
        });


        break;
      case 'player':
        handlePlayerConnection(io, socket, playerId);
        obstacleManager(io, socket); // Register Obstacle Handlers for Player too
        registerAccelerationHandlers(io, socket); // Register Acceleration Handlers for Player
        registerFinishLineHandlers(io, socket); // ✅ Register Finish Line Handlers for Player
        break;
      case 'guest':
        handleGuestConnection(io, socket);
        break;
      case 'monitor':
        handleMonitorConnection(io, socket);
        break;
      default:
        console.warn(`[Socket] Unknown role: ${role}`);
        // Default to guest? or disconnect?
        handleGuestConnection(io, socket);
        break;
    }

    // Common event listeners (legacy/debug)
    socket.on('message', (data) => {
      console.log('Received message:', data);
      io.emit('message', data); 
    });
  });
}
