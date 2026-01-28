import mongoose from 'mongoose';
// import { GamePhase } from '../game/GameState';

const MatchSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: true },
  phase: { type: String, default: 'IDLE' },
  roundId: { type: String },
  timestamp: { type: Number, default: Date.now },
  
  // Embedded state objects
  warmUp: {
      status: { type: String, default: 'IDLE' },
      currentPlayerId: { type: String },
      currentPlayerName: { type: String },
      currentPackId: { type: String },
      currentPackName: { type: String },
      currentQuestion: { type: mongoose.Schema.Types.Mixed }, // { id, content, description }
      timer: { type: Number, default: 60 },
      totalScoreReceived: { type: Number, default: 0 },
      lastAnswer: { type: mongoose.Schema.Types.Mixed }, // { result: 'CORRECT'|'WRONG', timestamp }
      
      // Preview
      previewSelectedPlayerId: { type: String },
      previewSelectedPlayerName: { type: String },
      previewSelectedPackId: { type: String },
      previewSelectedPackName: { type: String }
  },
  obstacle: {
      status: { type: String, default: 'IDLE' },
      currentImage: { type: String, default: '' },
      imageRevealed: { type: Boolean, default: false },
      revealedPieces: { type: [Boolean], default: [false, false, false, false, false] },
      finalCNV: { type: String, default: '' },
      currentRowIndex: { type: Number, default: -1 },
      currentRowQuestion: { type: String },
      currentRowLength: { type: Number },
      // rowResults: { type: Array, default: [] }, // optional if needed
      rowLengths: { type: [Number], default: [] },
      rowContents: { type: [String], default: [] },
      timer: { type: Number, default: 0 },
      answers: { type: mongoose.Schema.Types.Mixed, default: {} }, // Use Mixed to ensure POJO behavior
      grading: { type: mongoose.Schema.Types.Mixed, default: {} },
      cnvLocked: { type: Boolean, default: false },
      buzzerQueue: { type: Array, default: [] },
      eliminatedPlayerIds: { type: [String], default: [] }
  },
  acceleration: {
      questionNumber: { type: Number, default: null },
      mediaType: { type: String },
      mediaUrl: { type: String },
      questionText: { type: String },
      questionDescription: { type: String },
      referenceAnswer: { type: String },
      isTimerRunning: { type: Boolean, default: false },
      timeLeft: { type: Number, default: 30 },
      answers: { type: Array, default: [] },
      status: { type: String, default: 'IDLE' },
      resourceId: { type: String }
  },
  finishLine: {
      status: { type: String, default: 'IDLE' }, // IDLE | PACK_SELECTION | PLAYING_QUESTION | FINISHED
      selectedPlayerId: { type: String },
      selectedPlayerName: { type: String },
      availablePacks: {
          type: Array,
          default: [
              { packType: 40, count: 4 },
              { packType: 60, count: 4 },
              { packType: 80, count: 4 }
          ]
      },
      currentPack: { type: mongoose.Schema.Types.Mixed }, // { packId, packType, ownerId, ownerName, questions[] }
      currentQuestionIndex: { type: Number, default: 0 },
      isTimerRunning: { type: Boolean, default: false },
      timeLeft: { type: Number, default: 30 },
      buzzerEnabled: { type: Boolean, default: false },
      buzzerQueue: { type: Array, default: [] }, // [{ playerId, playerName, buzzTime }]
      selectedStealerId: { type: String },
      finishedPlayerIds: { type: Array, default: [] }, // List of players who completed their turn
      starUsedPlayerIds: { type: [String], default: [] }, // NEW: Track star usage
      bankId: { type: String } // Reference to FinishLineQuestionBank
  },
  finish: {
      currentPlayerId: { type: String },
      currentPackage: { type: Number },
      questionIndex: { type: Number, default: 0 },
      starHope: { type: Boolean, default: false },
      isTimerRunning: { type: Boolean, default: false },
      timeLeft: { type: Number, default: 0 }
  },
  
  // Add other rounds as needed later
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Match || mongoose.model('Match', MatchSchema);
