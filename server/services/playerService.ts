import Player from '@/server/models/Player';
import Session from '@/server/models/Session';

export async function getOfflinePlayers() {
  // Get all active player sessions
  const activeSessions = await Session.find({ role: 'player' }).select('playerId');
  const activePlayerIds = activeSessions.map(s => s.playerId);

  // Find players NOT in the active list
  return await Player.find({ _id: { $nin: activePlayerIds } }).sort({ name: 1 });
}

export async function getAllPlayers() {
  return await Player.find({}).sort({ createdAt: -1 });
}

export async function createPlayer(data: { name: string; meta?: Record<string, unknown> }) {
  return await Player.create(data);
}

export async function updatePlayer(id: string, data: { name?: string; meta?: Record<string, unknown> }) {
  return await Player.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
}

export async function deletePlayer(id: string) {
  return await Player.deleteOne({ _id: id });
}

export async function getPlayerById(id: string) {
    return await Player.findById(id);
}

export async function updatePlayerScore(id: string, round: 'warmup' | 'obstacles' | 'acceleration' | 'finish', scoreToAdd: number) {
  const player = await Player.findById(id);
  if (!player) return null;

  // Initialize scores if not present (for existing docs)
  if (!player.scores) {
      player.scores = { warmup: 0, obstacles: 0, acceleration: 0, finish: 0, total: 0 };
  }

  // Update specific round score
  player.scores[round] = (player.scores[round] || 0) + scoreToAdd;
  
  // Recalculate total
  player.scores.total = (player.scores.warmup || 0) + 
                        (player.scores.obstacles || 0) + 
                        (player.scores.acceleration || 0) + 
                        (player.scores.finish || 0);

  return await player.save();
}

export async function resetPlayerScores(round?: 'warmup' | 'obstacles' | 'acceleration' | 'finish') {
    if (round) {
        // Reset specific round for ALL players
        const players = await Player.find({});
        for (const player of players) {
            if (!player.scores) player.scores = { warmup: 0, obstacles: 0, acceleration: 0, finish: 0, total: 0 };
            
            player.scores[round] = 0;
            player.scores.total = (player.scores.warmup || 0) + 
                                  (player.scores.obstacles || 0) + 
                                  (player.scores.acceleration || 0) + 
                                  (player.scores.finish || 0);
            await player.save();
        }
    } else {
        // Reset ALL scores
        await Player.updateMany({}, { 
            scores: { warmup: 0, obstacles: 0, acceleration: 0, finish: 0, total: 0 } 
        });
    }
}
