import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import connectDB from './lib/db/connect';
import { setupSocketHandlers } from './server/socket/handler';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Connect to MongoDB
  await connectDB().then(async () => {
    console.log('Connected to MongoDB');
    
    // Cleanup zombie sessions on startup
    try {
        // Dynamic import to avoid earlier compilation issues if model isn't ready
        const { default: Session } = await import('./server/models/Session');
        await Session.deleteMany({});
        console.log('[Startup] Cleared all active sessions from DB');
    } catch (err) {
        console.error('[Startup] Failed to clear sessions', err);
    }

  }).catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer,{
    cors: {
      origin: '*',
    },
  });
  setupSocketHandlers(io);
  
  // Initialize GameManager with IO
  import('./server/game/GameManager').then(({ default: gameManager }) => {
      gameManager.setIO(io);
  });

  httpServer.listen(port, () => {
    console.log(
      `> Ready on http://${hostname}:${port}`
    );
  });
});
