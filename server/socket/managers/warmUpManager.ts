import { Server, Socket } from 'socket.io';
import GameManager from '../../game/GameManager';
import WarmUpPack from '../../models/WarmUpPack';
import Player from '../../models/Player';
import { POINTS } from '../../game/GameConstants';

let timerInterval: NodeJS.Timeout | null = null;

export const warmUpManager = (io: Server, socket: Socket) => {
  
  // SETUP TURN
  socket.on('mc_warmup_setup', async ({ playerId, packId }) => {
    try {
      console.log(`[WarmUp] Setup: Player ${playerId}, Pack ${packId}`);
      
      const player = await Player.findById(playerId);
      const pack = await WarmUpPack.findById(packId);
      
      if (!pack || !player) return socket.emit('error', 'Pack or Player not found');

      // 1. Check if Pack is already used by someone else
      if (pack.playedBy && pack.playedBy.toString() !== playerId) {
          socket.emit('error', 'Gói câu hỏi này đã được sử dụng bởi thí sinh khác!');
          return;
      }

      // 2. Check if Player has already played a different pack
      const existingPack = await WarmUpPack.findOne({ playedBy: playerId, _id: { $ne: packId } });
      if (existingPack) {
          socket.emit('error', `Thí sinh này đã thi xong (Gói: ${existingPack.name})!`);
          return;
      }

      // Use the stored index to resume or start from 0
      const startIndex = pack.currentQuestionIndex || 0;
      const currentQuestion = pack.questions[startIndex] || null;

      // Update Game Manager
      GameManager.updateWarmUpState({
          status: 'READY',
          currentPlayerId: playerId,
          currentPlayerName: player.name,
          currentPackId: packId,
          currentPackName: pack.name,
          currentQuestion: currentQuestion ? {
              id: currentQuestion.id,
              content: currentQuestion.content,
              description: currentQuestion.description,
          } : null,
          timer: 60,
          totalScoreReceived: 0,
          lastAnswer: undefined
      });

      // Update Pack usage status ONLY if not already set (locking it to this player)
      if (!pack.playedBy) {
          pack.playedBy = playerId;
          await pack.save();
      }

      io.emit('system_notification', { message: `Lượt thi Khởi Động của ${player.name} chuẩn bị bắt đầu!`, type: 'info' });

    } catch (error) {
      console.error(error);
      socket.emit('error', 'Setup failed');
    }
  });

  // REALTIME PREVIEW (SELECTION)
  socket.on('mc_warmup_preview_change', async ({ playerId, packId }) => {
      // Fetch names for better UX on clients
      let playerName: string | undefined;
      let packName: string | undefined;

      if (playerId) {
          const p = await Player.findById(playerId);
          playerName = p?.name;
      }
      if (packId) {
          const p = await WarmUpPack.findById(packId);
          packName = p?.name;
      }

      GameManager.updateWarmUpState({
          previewSelectedPlayerId: playerId,
          previewSelectedPlayerName: playerName,
          previewSelectedPackId: packId,
          previewSelectedPackName: packName
      });
  });

  // START TIMER
  socket.on('mc_warmup_start', () => {
    const state = GameManager.getState();
    if (state.phase !== 'WARMUP' || state.warmUp?.status !== 'READY') return;

    console.log('[WarmUp] Timer Started');
    GameManager.updateWarmUpState({ status: 'PLAYING' });

    // Start 60s Timer (Interval)
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        const currentState = GameManager.getState();
        if (currentState.phase !== 'WARMUP' || currentState.warmUp?.status !== 'PLAYING') {
             if (timerInterval) clearInterval(timerInterval);
             return;
        }

        const newTime = (currentState.warmUp?.timer || 0) - 1;
        
        if (newTime <= 0) {
            // FINISH ROUND
            if (timerInterval) clearInterval(timerInterval);
            finishTurn(io);
        } else {
            GameManager.updateWarmUpState({ timer: newTime });
        }
    }, 1000);
  });

  // GRADE (CORRECT / WRONG / PASS)
  socket.on('mc_warmup_grade', async ({ result }: { result: 'CORRECT' | 'WRONG' | 'PASS' }) => {
      const state = GameManager.getState();
      if (state.phase !== 'WARMUP' || state.warmUp?.status !== 'PLAYING') return;

      const { currentPlayerId, currentPackId, totalScoreReceived } = state.warmUp!;

      // 1. Update Score if Correct
      if (result === 'CORRECT' && currentPlayerId) {
          const points = POINTS.WARM_UP.CORRECT; // 10
          // Update DB
          await Player.findByIdAndUpdate(currentPlayerId, {
              $inc: { "scores.warmup": points, "scores.total": points }
          });
          // Update State Local Score (visual mostly)
          GameManager.updateWarmUpState({ 
              totalScoreReceived: (totalScoreReceived || 0) + points,
              lastAnswer: { result: 'CORRECT', timestamp: Date.now() }
          });
          io.emit('refresh_ranking'); // Notify boards
      } else {
          GameManager.updateWarmUpState({ 
            lastAnswer: { result: result === 'PASS' ? 'PASS' : 'WRONG', timestamp: Date.now() }
        });
      }

      // 2. Move to Next Question
      if (currentPackId) {
          const pack = await WarmUpPack.findById(currentPackId);
          if (pack) {
              const nextIndex = (pack.currentQuestionIndex || 0) + 1;
              
              if (nextIndex >= pack.questions.length) {
                  // End of Pack
                  finishTurn(io);
              } else {
                  // Next Question
                  pack.currentQuestionIndex = nextIndex;
                  await pack.save();

                  const nextQ = pack.questions[nextIndex];
                  GameManager.updateWarmUpState({ 
                      currentQuestion: {
                          id: nextQ.id,
                          content: nextQ.content,
                          description: nextQ.description
                      }
                  });
              }
          }
      }
  });

  // RESET / STOP
  socket.on('mc_warmup_reset', async () => {
     if (timerInterval) clearInterval(timerInterval);
     
     // Optionally clear DB status if requested (full reset vs just stop)
     // For now, just reset state to IDLE
     GameManager.updateWarmUpState({
         status: 'IDLE',
         currentPlayerId: null,
         currentPlayerName: undefined,
         currentPackId: null,
         currentPackName: undefined,
         currentQuestion: null,
         timer: 60,
         totalScoreReceived: 0,
         lastAnswer: undefined
     });
     
     io.emit('system_notification', { message: `Vòng Khởi Động đã được reset.`, type: 'warning' });
  });

};

async function finishTurn(io: Server) {
    console.log('[WarmUp] Turn Finished');
    GameManager.updateWarmUpState({ status: 'FINISHED' });
    
    // Mark Pack as Completed
    const state = GameManager.getState();
    if (state.warmUp?.currentPackId) {
        await WarmUpPack.findByIdAndUpdate(state.warmUp.currentPackId, { isCompleted: true });
    }
    
    io.emit('system_notification', { message: `Phần thi Khởi Động kết thúc!`, type: 'success' });
}
