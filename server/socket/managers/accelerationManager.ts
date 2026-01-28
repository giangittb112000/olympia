import { Server, Socket } from 'socket.io';
import GameManager from '../../game/GameManager';
import AccelerationResource from '@/server/models/AccelerationResource';
import Match from '@/server/models/Match';
import Player from '@/server/models/Player';
import { updatePlayerScore } from '@/server/services/playerService';

export function registerAccelerationHandlers(io: Server, socket: Socket) {
  
  // RESET ROUND
  socket.on('mc_acceleration_reset', async () => {
    const defaultState = {
      questionNumber: null,
      mediaType: undefined,
      mediaUrl: undefined,
      questionText: undefined,
      questionDescription: undefined,
      referenceAnswer: undefined,
      isTimerRunning: false,
      timeLeft: 30,
      answers: [],
      status: 'IDLE' as const,
      resourceId: undefined
    };
    
    GameManager.updateAccelerationState(defaultState);
    
    await Match.findOneAndUpdate(
      {},
      { acceleration: defaultState },
      { new: true }
    );
    
    io.emit('gamestate_sync', GameManager.getState());
    console.log('[Acceleration] Round reset');
  });
  
  // START ROUND (Load Question 1)
  socket.on('mc_acceleration_start_round', async () => {
    try {
      const resource = await AccelerationResource.findOne().sort({ createdAt: -1 });
      if (!resource) {
        socket.emit('error', { message: 'No resource found' });
        return;
      }
      
      const question1 = resource.questions.find((q: typeof resource.questions[0]) => q.questionNumber === 1);
      if (!question1) return;
      
      GameManager.updateAccelerationState({
        questionNumber: 1,
        mediaType: question1.mediaType,
        mediaUrl: question1.mediaUrl,
        questionText: question1.questionText,
        questionDescription: question1.questionDescription,
        referenceAnswer: question1.referenceAnswer,
        timeLeft: question1.timeLimit,
        status: 'IDLE' as const,
        resourceId: resource._id.toString()
      });
      
      io.emit('gamestate_sync', GameManager.getState());
      console.log('[Acceleration] Started - Question 1');
    } catch (e) {
      console.error('Error starting acceleration:', e);
    }
  });
  
  // START TIMER
  socket.on('mc_acceleration_start_timer', () => {
    const state = GameManager.getState();
    if (!state.acceleration || state.acceleration.questionNumber === null) return;
    
    GameManager.updateAccelerationState({
      isTimerRunning: true,
      status: 'PLAYING' as const
    });
    
    io.emit('gamestate_sync', GameManager.getState());
    GameManager.startAccelerationTimer(io);
    console.log('[Acceleration] Timer started');
  });
  
  // PLAYER ANSWER
  socket.on('player_acceleration_answer', async ({ playerId, answer }: { playerId: string; answer: string }) => {
    const state = GameManager.getState();
    if (!state.acceleration) {
      console.log('[Acceleration] No acceleration state');
      return;
    }
    
    // Allow answers during PLAYING status (including when timer just hit 0)
    if (state.acceleration.status !== 'PLAYING') {
      console.log(`[Acceleration] Wrong status: ${state.acceleration.status}`);
      return;
    }
    
    // Check if player already answered
    const existingAnswer = state.acceleration.answers.find((a: typeof state.acceleration.answers[0]) => a.playerId === playerId);
    if (existingAnswer) {
      console.log(`[Acceleration] Player ${playerId} already answered`);
      socket.emit('error', { message: 'You already submitted an answer' });
      return;
    }
    
    // Fetch player name from database
    const player = await Player.findById(playerId);
    if (!player) {
      console.log(`[Acceleration] Player ${playerId} not found in database`);
      return;
    }
    
    const newAnswer = {
      playerId,
      playerName: player.name,
      answer: answer || '(Không trả lời)', // Mark empty answers
      submittedAt: Date.now(),
      responseTime: state.acceleration.timeLeft,
      isCorrect: undefined,
      score: 0
    };
    
    const updatedAnswers = [...state.acceleration.answers, newAnswer];
    GameManager.updateAccelerationState({ answers: updatedAnswers });
    
    io.emit('gamestate_sync', GameManager.getState());
    console.log(`[Acceleration] Answer from ${player.name}: "${answer || '(empty)'}"`);
  });
  
  // MC GRADE
  socket.on('mc_acceleration_grade', async ({ playerId, isCorrect }: { playerId: string; isCorrect: boolean }) => {
    const state = GameManager.getState();
    if (!state.acceleration) return;
    
    const answers = state.acceleration.answers;
    const answerIndex = answers.findIndex((a: typeof answers[0]) => a.playerId === playerId);
    if (answerIndex === -1) return;
    
    // Sort by submittedAt to determine ranking
    // 1. Update the current answer's status first
    answers[answerIndex].isCorrect = isCorrect;
    
    // 2. Recalculate ranking and scores for ALL correct answers in this question
    // This ensures that even if MC grades out of order, the points are always correct
    const sortedAllAnswers = [...answers].sort((a, b) => a.submittedAt - b.submittedAt);
    const POINTS: Record<number, number> = { 1: 40, 2: 30, 3: 20, 4: 10 };
    
    let correctRank = 0;
    for (const ans of sortedAllAnswers) {
      if (ans.isCorrect === true) {
        correctRank++;
        const newScore = POINTS[correctRank] || 0;
        
        // If this player's score changed, update it in DB
        if (ans.score !== newScore) {
          const diff = newScore - (ans.score || 0);
          if (diff !== 0) {
            await updatePlayerScore(ans.playerId, 'acceleration', diff);
          }
          ans.score = newScore;
        }
      } else if (ans.isCorrect === false || ans.isCorrect === undefined) {
        // Correct answers that were changed to wrong/reset should have points removed
        if (ans.score > 0) {
          await updatePlayerScore(ans.playerId, 'acceleration', -ans.score);
          ans.score = 0;
        }
      }
    }
    
    // 3. Update state and broadcast
    GameManager.updateAccelerationState({ answers });
    
    // Broadcast State Sync
    io.emit('gamestate_sync', GameManager.getState());
    // Broadcast Players Update so all boards refresh scores
    io.emit('refresh_ranking');
    
    console.log(`[Acceleration] Graded ${playerId}: ${isCorrect ? 'CORRECT' : 'WRONG'}. Recalculated all scores.`);
  });
  
  // NEXT QUESTION
  socket.on('mc_acceleration_next_question', async () => {
    const state = GameManager.getState();
    if (!state.acceleration) return;
    
    const currentQ = state.acceleration.questionNumber;
    if (!currentQ || currentQ >= 4) return;
    
    const nextQNum = (currentQ + 1) as 1 | 2 | 3 | 4;
    
    try {
      const resource = await AccelerationResource.findById(state.acceleration.resourceId);
      if (!resource) return;
      
      const nextQuestion = resource.questions.find((q: typeof resource.questions[0]) => q.questionNumber === nextQNum);
      if (!nextQuestion) return;
      
      GameManager.updateAccelerationState({
        questionNumber: nextQNum,
        mediaType: nextQuestion.mediaType,
        mediaUrl: nextQuestion.mediaUrl,
        questionText: nextQuestion.questionText,
        questionDescription: nextQuestion.questionDescription,
        referenceAnswer: nextQuestion.referenceAnswer,
        timeLeft: nextQuestion.timeLimit,
        answers: [],
        isTimerRunning: false,
        status: 'IDLE' as const
      });
      
      io.emit('gamestate_sync', GameManager.getState());
      console.log(`[Acceleration] Moved to Question ${nextQNum}`);
    } catch (e) {
      console.error('Error loading next question:', e);
    }
  });
  
  // FINISH ROUND
  socket.on('mc_acceleration_finish_round', () => {
    GameManager.updateAccelerationState({ status: 'FINISHED' as const });
    io.emit('gamestate_sync', GameManager.getState());
    console.log('[Acceleration] Round finished');
  });
}
