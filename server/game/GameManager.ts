import { Server } from 'socket.io';
import { GamePhase, GameState } from './GameState';
import Match from '../models/Match';

class GameManager {
  private static instance: GameManager;
  private state: GameState;
  private io: Server | null = null;
  private accelerationTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.state = {
      phase: 'IDLE',
      timestamp: Date.now(),
    };
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  public setIO(io: Server) {
    this.io = io;
    this.loadStateFromDB();
  }

  public getState(): GameState {
    return this.state;
  }

  public setPhase(phase: GamePhase) {
    // Only MC should be able to trigger this (via handler check)
    this.state.phase = phase;
    this.state.timestamp = Date.now();
    
    // Reset round states
    if (phase === 'WARMUP') {
        this.state.warmUp = {
            status: 'IDLE',
            currentPlayerId: null,
            currentPackId: null,
            currentQuestion: null,
            timer: 60,
            totalScoreReceived: 0
        };
    } else if (phase === 'OBSTACLES') {
        // Only initialize if not already present or if we need to ensure structure
        if (!this.state.obstacle || this.state.obstacle.status === undefined) {
             this.state.obstacle = {
                status: 'IDLE',
                currentImage: '',
                imageRevealed: false,
                revealedPieces: [false, false, false, false, false],
                finalCNV: '',
                currentRowIndex: -1,
                rowLengths: [],
                rowContents: [],
                rowResults: [],
                timer: 15,
                answers: {},
                grading: {},
                cnvLocked: false,
                buzzerQueue: [],
                eliminatedPlayerIds: []
            };
        }
    } else if (phase === 'ACCELERATION') {
        this.state.acceleration = {
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
    } else if (phase === 'FINISH') {
        if (!this.state.finishLine) {
            this.state.finishLine = {
                status: 'IDLE',
                currentQuestionIndex: -1,
                isTimerRunning: false,
                timeLeft: 0,
                buzzerEnabled: false,
                buzzerQueue: []
            };
        }
    }

    this.persistState();
    this.broadcastState();
  }

  public updateWarmUpState(partial: Partial<import('./GameConstants').WarmUpState>) {
      if (!this.state.warmUp) return;
      this.state.warmUp = { ...this.state.warmUp, ...partial };
      this.persistState();
      this.broadcastState();
  }

  public updateObstacleState(partial: Partial<import('./GameConstants').ObstacleState>) {
      if (!this.state.obstacle) return;
      
      // DEBUG: Log key updates
      if (partial.answers) {
          console.log('[GameManager DEBUG] Updating Answers:', JSON.stringify(partial.answers, null, 2));
      }
      if (partial.status) {
          console.log(`[GameManager DEBUG] Updating Obstacle Status: ${partial.status}`);
      }

      this.state.obstacle = { ...this.state.obstacle, ...partial };
      this.persistState();
      this.broadcastState();
  }

  public updateAccelerationState(partial: Partial<import('./GameConstants').AccelerationState>) {
      if (!this.state.acceleration) return;
      
      // DEBUG: Log answers updates
      if (partial.answers) {
          console.log('[GameManager] Updating Acceleration Answers:', {
              count: partial.answers.length,
              answers: partial.answers.map(a => ({ playerId: a.playerId, answer: a.answer }))
          });
      }
      
      this.state.acceleration = { ...this.state.acceleration, ...partial };
      this.persistState();
      this.broadcastState();
  }

  public updateFinishLineState(partial: Partial<import('./GameConstants').FinishLineState>) {
      if (!this.state.finishLine) return;
      this.state.finishLine = { ...this.state.finishLine, ...partial };
      this.persistState();
      this.broadcastState();
  }



  public startAccelerationTimer(io: Server) {
    if (this.accelerationTimer) {
      clearInterval(this.accelerationTimer);
    }
    
    this.accelerationTimer = setInterval(() => {
      const state = this.getState();
      if (!state.acceleration || !state.acceleration.isTimerRunning) {
        if (this.accelerationTimer) clearInterval(this.accelerationTimer);
        return;
      }
      
      const newTime = state.acceleration.timeLeft - 1;
      
      if (newTime <= 0) {
        // Time's up
        this.updateAccelerationState({
          timeLeft: 0,
          isTimerRunning: false,
          status: 'GRADING' as const
        });
        if (this.accelerationTimer) clearInterval(this.accelerationTimer);
        io.emit('gamestate_sync', this.getState());
        console.log('[Acceleration] Timer ended');
      } else {
        this.updateAccelerationState({ timeLeft: newTime });
        // Don't broadcast every second to reduce traffic
        if (newTime % 5 === 0 || newTime <= 10) {
          io.emit('gamestate_sync', this.getState());
        }
      }
    }, 1000);
  }

  private async loadStateFromDB() {
      try {
          // Dynamic import to avoid circular dependency or model issues
          const match = await Match.findOne({ isActive: true }).sort({ createdAt: -1 });
          if (match) {
              console.log('[GameManager] Restored state from DB:', match.phase);
              const matchObj = match.toObject();
              
              this.state = {
                  phase: match.phase as GamePhase,
                  timestamp: match.timestamp,
                  warmUp: matchObj.warmUp ? {
                      status: matchObj.warmUp.status || 'IDLE',
                      currentPlayerId: matchObj.warmUp.currentPlayerId || null,
                      currentPlayerName: matchObj.warmUp.currentPlayerName,
                      currentPackId: matchObj.warmUp.currentPackId || null,
                      currentPackName: matchObj.warmUp.currentPackName,
                      currentQuestion: matchObj.warmUp.currentQuestion || null,
                      timer: matchObj.warmUp.timer !== undefined ? matchObj.warmUp.timer : 60,
                      totalScoreReceived: matchObj.warmUp.totalScoreReceived || 0,
                      lastAnswer: matchObj.warmUp.lastAnswer,
                      previewSelectedPlayerId: matchObj.warmUp.previewSelectedPlayerId,
                      previewSelectedPlayerName: matchObj.warmUp.previewSelectedPlayerName,
                      previewSelectedPackId: matchObj.warmUp.previewSelectedPackId,
                      previewSelectedPackName: matchObj.warmUp.previewSelectedPackName
                  } : undefined,
                  obstacle: matchObj.obstacle ? {
                      status: matchObj.obstacle.status || 'IDLE',
                      currentImage: matchObj.obstacle.currentImage || '',
                      imageRevealed: matchObj.obstacle.imageRevealed || false,
                      revealedPieces: matchObj.obstacle.revealedPieces || [false, false, false, false, false],
                      finalCNV: matchObj.obstacle.finalCNV || '',
                      currentRowIndex: matchObj.obstacle.currentRowIndex ?? -1,
                      currentRowQuestion: matchObj.obstacle.currentRowQuestion,
                      currentRowLength: matchObj.obstacle.currentRowLength,
                      rowLengths: matchObj.obstacle.rowLengths || [],
                      rowContents: matchObj.obstacle.rowContents || [],
                      rowResults: matchObj.obstacle.rowResults || [],
                      
                      timer: matchObj.obstacle.timer || 0,
                      answers: matchObj.obstacle.answers || {},
                      grading: matchObj.obstacle.grading || {},
                      cnvLocked: matchObj.obstacle.cnvLocked || false,
                      buzzerQueue: matchObj.obstacle.buzzerQueue || [],
                      eliminatedPlayerIds: matchObj.obstacle.eliminatedPlayerIds || []
                  } : undefined,
                  acceleration: matchObj.acceleration ? {
                      questionNumber: matchObj.acceleration.questionNumber,
                      mediaType: matchObj.acceleration.mediaType,
                      mediaUrl: matchObj.acceleration.mediaUrl,
                      questionText: matchObj.acceleration.questionText,
                      questionDescription: matchObj.acceleration.questionDescription,
                      referenceAnswer: matchObj.acceleration.referenceAnswer,
                      isTimerRunning: matchObj.acceleration.isTimerRunning,
                      timeLeft: matchObj.acceleration.timeLeft || 30,
                      answers: matchObj.acceleration.answers || [],
                      status: matchObj.acceleration.status || 'IDLE',
                      resourceId: matchObj.acceleration.resourceId
                  } : undefined,
                  finishLine: matchObj.finishLine || undefined,
              };
              this.broadcastState();
          } else {
              await this.persistState();
          }
      } catch (err) {
          console.error('[GameManager] Failed to load state:', err);
      }
  }

  private async persistState() {
      try {
          const matchData = {
              phase: this.state.phase,
              timestamp: this.state.timestamp,
              warmUp: this.state.warmUp,
              obstacle: this.state.obstacle,
              acceleration: this.state.acceleration,
              finishLine: this.state.finishLine
          };
          
          const result = await Match.findOneAndUpdate(
              { isActive: true },
              matchData,
              { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          if (matchData.obstacle?.status === 'FINISHED') {
             console.log('[GameManager Persistence] Force Saved FINISHED. DB Result:', result?.obstacle?.status);
          }
      } catch (err) {
          console.error('[GameManager] Failed to persist state:', err);
      }
  }

  public handlePlayerBuzz(playerId: string, round: string) {
      if (round === 'OBSTACLES' && this.state.obstacle && !this.state.obstacle.cnvLocked) {
          this.state.obstacle.cnvLocked = true;
          // You might want to store WHO buzzed in ObstacleState if you want to show it.
          // For now, I'll just broadcast the lock.
          console.log(`[GameManager] Player ${playerId} buzzed in OBSTACLES`);
          this.persistState();
          this.broadcastState();
          // Ideally emit a specific event 'player_buzzed' if needed, but gamestate sync handles the lock.
      } else if (round === 'FINISH') {
          // handled in manager
      }
  }

  public handlePlayerAnswer(playerId: string, round: string) {
      // NOTE: Acceleration is now fully handled by accelerationManager.ts socket handlers
      // This method is kept for other rounds if needed
      if (round === 'ACCELERATION') {
          console.log('[GameManager] Acceleration answers are handled by socket manager, not here');
          return;
      }
  }

  private broadcastState() {
    if (this.io) {
      console.log(`[GameManager] Broadcasting Phase Change: ${this.state.phase}`);
      this.io.emit('gamestate_sync', this.state);
    }
  }
}

export default GameManager.getInstance();
