import { Server, Socket } from "socket.io";
import connectDB from "@/lib/db/connect";
import Match from "@/server/models/Match";
import Player from "@/server/models/Player";
import { updatePlayerScore } from "@/server/services/playerService";
import FinishLineQuestionBank from "@/server/models/FinishLineQuestionBank";
import {
  calculateScore,
  calculateStealScores,
} from "@/server/utils/finishLineScoring";
import { generatePack } from "@/server/utils/finishLineQuestions";
import gameManager from "@/server/game/GameManager";

// Socket Event Payload Interfaces
interface IToggleStarData { enabled: boolean; }
interface ITimerData { duration?: number; }
interface ISelectPlayerData { playerId: string; }
interface ISelectPackData {
  playerId: string;
  packType: 40 | 60 | 80;
}
interface IAnswerData { playerId: string; answerText: string; }
interface IBuzzData { playerId: string; }

// Game State Interfaces
interface IAvailablePack {
  packType: 40 | 60 | 80;
  count: number;
}

interface IBuzzerQueueItem {
  playerId: string;
  playerName: string;
  buzzTime: number;
}





/**
 * Register all Finish Line Round socket handlers
 */
export function registerFinishLineHandlers(io: Server, socket: Socket) {
  console.log("[FinishLine] Handlers registered for socket:", socket.id);

  // ========================================
  // MC CONTROL EVENTS (12 events)
  // ========================================

  /**
   * MC: Reset round to initial state
   */
  socket.on("mc_finishline_reset", async () => {
    try {
      await connectDB();

      const defaultState = {
        status: "IDLE" as const, // Explicit const to match type
        selectedPlayerId: undefined,
        selectedPlayerName: undefined,
        availablePacks: [
          { packType: 40 as const, count: 4 },
          { packType: 60 as const, count: 4 },
          { packType: 80 as const, count: 4 },
        ],
        currentPack: undefined,
        currentQuestionIndex: 0,
        isTimerRunning: false,
        timeLeft: 30,
        buzzerEnabled: false,
        buzzerQueue: [],
        selectedStealerId: undefined, // ✅ Clear stealer on reset
        finishedPlayerIds: [], // ✅ Clear finished players list
        bankId: undefined,
      };

      gameManager.updateFinishLineState(defaultState);
      
      // Reset question bank isUsed flags
      const match = await Match.findOne({ isActive: true });
      if (match?.finishLine.bankId) {
        const bank = await FinishLineQuestionBank.findById(match.finishLine.bankId);
        if (bank) {
          bank.resetUsedFlags();
          await bank.save();
          console.log('[FinishLine] Question bank isUsed flags reset');
        }
      }
      
      console.log("[FinishLine] Round reset");
    } catch (error) {
      console.error("Error resetting round:", error);
      socket.emit("error", { message: "Failed to reset round" });
    }
  });

  /**
   * MC: Start round (set up initial pack selection state)
   */
  socket.on("mc_finishline_start_round", async () => {
    try {
      await connectDB();

      const match = await Match.findOne({ isActive: true });
      if (!match) {
        socket.emit("error", { message: "No active match" });
        return;
      }

      // Get or create question bank
      const bank = await FinishLineQuestionBank.findOne({ matchId: match._id });
      if (!bank) {
        socket.emit("error", {
          message: "No question bank found. Please create one first.",
        });
        return;
      }

      gameManager.updateFinishLineState({
        status: "PACK_SELECTION",
        bankId: bank._id.toString(),
        starUsedPlayerIds: [], // Initialize star tracking
        availablePacks: [
          { packType: 40, count: 4 },
          { packType: 60, count: 4 },
          { packType: 80, count: 4 },
        ]
      });

      console.log(`[FinishLine] Round started - waiting for player selection`);
    } catch (error) {
      console.error("Error starting round:", error);
      socket.emit("error", { message: "Failed to start round" });
    }
  });

  /**
   * MC: Toggle star for current question
   */
  socket.on("mc_finishline_toggle_star", async (data: IToggleStarData) => {
    try {
      await connectDB();
      const { enabled } = data;

      const match = await Match.findOne({ isActive: true });
      if (!match?.finishLine.currentPack) {
        socket.emit("error", { message: "No active pack" });
        return;
      }


      
      const currentQ =
        match.finishLine.currentPack.questions[
          match.finishLine.currentQuestionIndex
        ];
      currentQ.starActivated = enabled;

      gameManager.updateFinishLineState({
          currentPack: match.finishLine.currentPack
      });
      io.emit("finishline_star_toggled", { enabled });

      console.log(`[FinishLine] Star ${enabled ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Error toggling star:", error);
      socket.emit("error", { message: "Failed to toggle star" });
    }
  });

  /**
   * MC: Start timer for current question
   */
  socket.on("mc_finishline_start_timer", async (data: ITimerData) => {
    try {
      await connectDB();
      const { duration = 30 } = data;

      const match = await Match.findOne({ isActive: true });
      if (!match) {
        socket.emit("error", { message: "No active match" });
        return;
      }

      gameManager.updateFinishLineState({
          isTimerRunning: true,
          timeLeft: duration
      });
      
      console.log(`[FinishLine] Timer started: ${duration}s`);

      // Start countdown interval
      const timerInterval = setInterval(() => {
        try {
          // Use GameManager state instead of DB hits
          const state = gameManager.getState();
          if (!state.finishLine?.isTimerRunning) {
            clearInterval(timerInterval);
            return;
          }

          const newTime = state.finishLine.timeLeft - 1;

          if (newTime <= 0) {
             gameManager.updateFinishLineState({
                 isTimerRunning: false,
                 timeLeft: 0
             });
            clearInterval(timerInterval);
            console.log("[FinishLine] Timer reached 0");
          } else {
             gameManager.updateFinishLineState({
                 timeLeft: newTime
             });
          }
        } catch (err) {
          console.error("[FinishLine] Timer interval error:", err);
          clearInterval(timerInterval);
        }
      }, 1000);
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  });

  /**
   * MC: Stop timer
   */
  socket.on("mc_finishline_stop_timer", async () => {
    try {
      await connectDB();

      const match = await Match.findOne({ isActive: true });
      if (!match) return;

      gameManager.updateFinishLineState({ isTimerRunning: false });
      console.log("[FinishLine] Timer stopped");
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  });

  /**
   * MC: Judge Answer (New Manual Logic)
   */
  socket.on("mc_finishline_judge_answer", async (data: { correct: boolean }) => {
    try {
        await connectDB();
        const { correct } = data;

        const match = await Match.findOne({ isActive: true });
        if (!match?.finishLine.currentPack) {
            socket.emit("error", { message: "No active pack" });
            return;
        }

        const pack = match.finishLine.currentPack;
        const currentQ = pack.questions[match.finishLine.currentQuestionIndex];

        // Retrieve the pending answer
        // Note: We need to trust the currentQ.answer contains the pending answer info
        if (!currentQ.answer || !currentQ.answer.playerId) {
             socket.emit("error", { message: "No pending answer to judge" });
             return;
        }

        const playerId = currentQ.answer.playerId;
        const player = await Player.findById(playerId);
        
        // Calculate points based on MC judgment
        const pointsEarned = calculateScore(
            currentQ.points,
            correct,
            currentQ.starActivated,
            false
        );

        // Update score in DB
        await updatePlayerScore(playerId, "finish", pointsEarned);
        io.emit("refresh_ranking"); // ✅ Trigger ranking refresh

        // Update answer record
        currentQ.answer.isCorrect = correct;
        currentQ.answer.pointsEarned = pointsEarned;

        // Save state updates
        gameManager.updateFinishLineState({
             currentPack: match.finishLine.currentPack,
             isTimerRunning: false // Ensure timer is stopped
        });

        // Broadcast Result
        io.emit("finishline_answer_result", {
            playerId,
            playerName: player?.name || "Unknown",
            isCorrect: correct,
            pointsEarned,
            correctAnswer: correct ? undefined : currentQ.referenceAnswer
        });

        console.log(`[FinishLine] Judge: Answer ${correct ? "ACCEPTED" : "REJECTED"} (${pointsEarned}pts)`);

    } catch (error) {
        console.error("Error judging answer:", error);
        socket.emit("error", { message: "Failed to judge answer" });
    }
  });

  /**
   * MC: Enable buzzer for steal attempts
   */
  socket.on("mc_finishline_enable_buzzer", async () => {
    try {
      await connectDB();

      const match = await Match.findOne({ isActive: true });
      if (!match) return;

      gameManager.updateFinishLineState({
          buzzerEnabled: true,
          buzzerQueue: []
      });
      io.emit("finishline_buzzer_enabled");

      console.log("[FinishLine] Buzzer enabled");
    } catch (error) {
      console.error("Error enabling buzzer:", error);
    }
  });

  /**
   * MC: Disable buzzer
   */
  socket.on("mc_finishline_disable_buzzer", async () => {
    try {
      await connectDB();

      const match = await Match.findOne({ isActive: true });
      if (!match) return;

      gameManager.updateFinishLineState({
          buzzerEnabled: false
      });
      console.log("[FinishLine] Buzzer disabled");
    } catch (error) {
      console.error("Error disabling buzzer:", error);
    }
  });

  /**
   * MC: Select player for next pack
   */
  socket.on("mc_finishline_select_player", async (data: ISelectPlayerData) => {
    try {
      await connectDB();
      const { playerId } = data;

      const match = await Match.findOne({ isActive: true });
      const player = await Player.findById(playerId);

      if (!match || !player) {
        socket.emit("error", { message: "Match or player not found" });
        return;
      }
      
      // Check if player already finished
      if (match.finishLine.finishedPlayerIds?.includes(playerId)) {
          socket.emit("error", { message: "Player already finished their turn" });
          return;
      }

      gameManager.updateFinishLineState({
          status: "PACK_SELECTION",
          selectedPlayerId: playerId,
          selectedPlayerName: player.name, // Fixed: use name from player object
          currentPack: undefined,
          currentQuestionIndex: 0,
          selectedStealerId: undefined // ✅ Clear stealer
      });

      io.emit("finishline_pack_selection_started", {
        playerId,
        playerName: player.name,
      });

      console.log(`[FinishLine] ${player.name} selected for pack`);
    } catch (error) {
      console.error("Error selecting player:", error);
      socket.emit("error", { message: "Failed to select player" });
    }
  });

  /**
   * MC: Next question in pack
   */
  socket.on("mc_finishline_next_question", async () => {
    try {
      await connectDB();

      const match = await Match.findOne({ isActive: true });
      if (!match?.finishLine.currentPack) {
        socket.emit("error", { message: "No active pack" });
        return;
      }

      const nextIndex = match.finishLine.currentQuestionIndex + 1;
      const pack = match.finishLine.currentPack;
      
      const updateData: Partial<import("@/server/game/GameConstants").FinishLineState> = {};

      if (nextIndex >= pack.questions.length) {
        // Pack completed
        updateData.status = "PACK_SELECTION";
        updateData.currentPack = undefined;
        updateData.currentQuestionIndex = 0;
        updateData.selectedStealerId = undefined; // ✅ Clear stealer
        updateData.selectedPlayerId = undefined; // ✅ Clear selected player so they don't see pack selection again
        
        // Add player to finished list
        const finishedIds = match.finishLine.finishedPlayerIds || [];
        if (!finishedIds.includes(pack.ownerId)) {
            finishedIds.push(pack.ownerId);
            updateData.finishedPlayerIds = finishedIds;
        }
        
        gameManager.updateFinishLineState(updateData);

        io.emit("finishline_pack_completed", {
          packType: pack.packType,
          ownerId: pack.ownerId,
        });
      } else {
        updateData.currentQuestionIndex = nextIndex;
        updateData.buzzerQueue = [];
        updateData.buzzerEnabled = false;
        updateData.isTimerRunning = false;
        updateData.timeLeft = 30; 
        updateData.selectedStealerId = undefined; // ✅ Clear stealer

        // CHECK STAR Logic
        const ownerId = pack.ownerId;
        const currentStarUsed = match.finishLine.starUsedPlayerIds || [];
        const hasUsed = currentStarUsed.includes(ownerId);
        
        // Transition to STAR_SELECTION if not used, else PLAYING_QUESTION
        const nextStatus = hasUsed ? "PLAYING_QUESTION" : "STAR_SELECTION";
        
        // Update state first
        gameManager.updateFinishLineState({
            ...updateData,
            status: nextStatus
        });
        
        // If jumping straight to playing (Star Used), CHECK MEDIA & AUTO START
        if (nextStatus === "PLAYING_QUESTION") {
             // CRITICAL: Update the local match object so the helper sees the NEW index
             match.finishLine.currentQuestionIndex = nextIndex;
             handleAutoStartTimer(match, io);
        }
      }
      
      console.log(`[FinishLine] Next question: ${nextIndex + 1}`);
    } catch (error) {
      console.error("Error moving to next question:", error);
    }
  });

  /**
   * MC: Finish round
   */
  socket.on("mc_finishline_finish_round", async () => {
    try {
      await connectDB();

      const match = await Match.findOne({ isActive: true });
      if (!match) return;

      gameManager.updateFinishLineState({ status: "FINISHED" });
      io.emit("finishline_round_finished");

      console.log("[FinishLine] Round finished");
    } catch (error) {
      console.error("Error finishing round:", error);
    }
  });

  /**
   * MC: Select pack type
   */
  socket.on("mc_finishline_select_pack", async (data: ISelectPackData) => {
    try {
      await connectDB();
      const { playerId, packType } = data;

      // Get current state from GameManager (in-memory, more reliable than DB)
      const currentState = gameManager.getState();
      if (!currentState.finishLine) {
        socket.emit("error", { message: "Finish Line not initialized" });
        return;
      }

      // Check if player already finished (from in-memory state)
      if (currentState.finishLine.finishedPlayerIds?.includes(playerId)) {
          socket.emit("error", { message: "Player already finished their turn" });
          return;
      }

      // Validate it's PACK_SELECTION phase
      if (currentState.finishLine.status !== "PACK_SELECTION") {
        socket.emit("error", { message: "Not in pack selection phase" });
        return;
      }

      // Verify the selected player is the one we are creating a pack for
      if (currentState.finishLine.selectedPlayerId !== playerId) {
        socket.emit("error", { message: "Selected player mismatch" });
        return;
      }

      // Now fetch match from DB for pack generation
      const match = await Match.findOne({ isActive: true });
      if (!match) {
        socket.emit("error", { message: "No active match" });
        return;
      }

      // Check pack availability
      const packInfo = match.finishLine.availablePacks.find(
        (p: IAvailablePack) => p.packType === packType
      );
      if (!packInfo || packInfo.count === 0) {
        socket.emit("error", { message: "Pack not available" });
        return;
      }

      // Generate pack
      const { success, packId, questions, error } = await generatePack(
        match._id.toString(),
        playerId,
        packType
      );

      if (!success) {
        socket.emit("error", { message: error || "Failed to select pack" });
        return;
      }

      // Get player info
      const player = await Player.findById(playerId);
      if (!player) {
        socket.emit("error", { message: "Player not found" });
        return;
      }

      const currentPack = {
        packId: packId!,
        packType,
        ownerId: playerId,
        ownerName: player.name,
        questions: questions!.map(q => ({
          ...q,
          answer: null,
          starActivated: false,
        })),
      };

       // Decrease pack count
      const updatedAvailablePacks = match.finishLine.availablePacks.map((p: IAvailablePack) => {
          if (p.packType === packType) {
              return { ...p, count: p.count - 1 };
          }
          return p;
      });

      // Check if player has used star
      const hasUsedStar = match.finishLine.starUsedPlayerIds?.includes(playerId);
      const nextStatus = hasUsedStar ? "PLAYING_QUESTION" : "STAR_SELECTION";

      gameManager.updateFinishLineState({
          currentPack,
          currentQuestionIndex: 0,
          status: nextStatus,
          availablePacks: updatedAvailablePacks
      });

      io.emit("finishline_pack_created", {
        packType,
        ownerId: playerId,
        ownerName: player.name,
        questionCount: questions!.length,
      });

      console.log(`[FinishLine] MC selected ${packType}pt pack for ${player.name}`);
    } catch (error) {
      console.error("Error selecting pack by MC:", error);
      socket.emit("error", { message: "Failed to select pack" });
    }
  });

  // ========================================
  // PLAYER ACTION EVENTS (5 events)
  // ========================================

  /**
   * Player: Select pack type
   */
  socket.on("player_finishline_select_pack", async (data: ISelectPackData) => {
    try {
      await connectDB();
      const { playerId, packType } = data;

      // Get current state from GameManager (in-memory, more reliable than DB)
      const currentState = gameManager.getState();
      if (!currentState.finishLine) {
        socket.emit("error", { message: "Finish Line not initialized" });
        return;
      }

      // Check if player already finished (from in-memory state)
      if (currentState.finishLine.finishedPlayerIds?.includes(playerId)) {
          socket.emit("error", { message: "Bạn đã hoàn thành phần thi của mình!" });
          return;
      }

      // Validate it's player's turn (from in-memory state)
      if (currentState.finishLine.status !== "PACK_SELECTION") {
        socket.emit("error", { message: "Not in pack selection phase" });
        return;
      }

      if (currentState.finishLine.selectedPlayerId !== playerId) {
        socket.emit("error", { message: "Not your turn" });
        return;
      }

      // Now fetch match from DB for pack generation
      const match = await Match.findOne({ isActive: true });
      if (!match) {
        socket.emit("error", { message: "No active match" });
        return;
      }

      // Check pack availability
      const packInfo = match.finishLine.availablePacks.find(
        (p: IAvailablePack) => p.packType === packType
      );
      if (!packInfo || packInfo.count === 0) {
        socket.emit("error", { message: "Pack not available" });
        return;
      }

      // Generate pack
      const { success, packId, questions, error } = await generatePack(
        match._id.toString(),
        playerId,
        packType
      );

      if (!success) {
        socket.emit("error", { message: error || "Failed to select pack" });
        return;
      }

      // Get player info - CRITICAL: Use Player.findById()
      const player = await Player.findById(playerId);
      if (!player) {
        console.error(`[FinishLine] Player ${playerId} not found in database`);
        socket.emit("error", { message: "Player not found" });
        return;
      }

      const currentPack = {
        packId: packId!,
        packType,
        ownerId: playerId,
        ownerName: player.name,
        questions: questions!.map(q => ({
          ...q,
          answer: null,
          starActivated: false,
        })),
      };

// 1. UPDATE select_pack to transition to STAR_SELECTION or PLAYING_QUESTION
      // ... (previous validation code) ...

       // Decrease pack count
      const updatedAvailablePacks = match.finishLine.availablePacks.map((p: IAvailablePack) => {
          if (p.packType === packType) {
              return { ...p, count: p.count - 1 };
          }
          return p;
      });

      // Check if player has used star
      const hasUsedStar = match.finishLine.starUsedPlayerIds?.includes(playerId);
      const nextStatus = hasUsedStar ? "PLAYING_QUESTION" : "STAR_SELECTION";

      gameManager.updateFinishLineState({
          currentPack,
          currentQuestionIndex: 0,
          status: nextStatus, // Transition logic
          availablePacks: updatedAvailablePacks
      });
      // ... (rest of emit logic) ...
    
    // 2. ADD CONFIRM STAR HANDLER (Insert before registerFinishLineHandlers closing brace ideally, or at end of Player events)


      io.emit("finishline_pack_created", {
        packType,
        ownerId: playerId,
        ownerName: player.name,
        questionCount: questions!.length,
      });

      console.log(`[FinishLine] ${player.name} selected ${packType}pt pack`);
    } catch (error) {
      console.error("Error selecting pack:", error);
      socket.emit("error", { message: "Failed to select pack" });
    }
  });

  /**
   * Helper: Start Timer or Wait for Video
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAutoStartTimer = (match: any, io: Server) => {
    const currentQ = match.finishLine.currentPack.questions[match.finishLine.currentQuestionIndex];
    const isVideo = currentQ.mediaType === "VIDEO";

    if (isVideo) {
      console.log(`[FinishLine] Question has VIDEO. Waiting for client_finishline_video_ended...`);
      // Ensure timer is OFF initially
      gameManager.updateFinishLineState({ isTimerRunning: false, timeLeft: 30 }); // Reset time just in case
    } else {
      console.log(`[FinishLine] No VIDEO. Auto-starting timer...`);
      // Start Timer Immediately
      gameManager.updateFinishLineState({ isTimerRunning: true, timeLeft: 30 });
      startTimerInterval(io); // We need to expose/refactor the interval logic
    }
  };

  /**
   * Refactored Timer Interval Start
   */
  const startTimerInterval = (io: Server) => {
      // Clear existing interval if any (pseudo-code, in real app need to track interval ID)
      // For this architecture, we rely on the closure or global map. 
      // Since we can't easily refactor the whole file to use a map right now, 
      // let's re-use the logic from mc_finishline_start_timer but safely.
      
      console.log(`[FinishLine] Timer Interval Logic Triggered`);
      // Ideally calls specific function. For now we will replicate the logic to ensure robustness.
      // ... (We will use a shared function if possible, but inline is safer for this edit)
      
       const timerInterval = setInterval(() => {
        try {
          const state = gameManager.getState();
          if (!state.finishLine?.isTimerRunning) {
            clearInterval(timerInterval);
            return;
          }

          const newTime = state.finishLine.timeLeft - 1;

          if (newTime <= 0) {
             gameManager.updateFinishLineState({
                 isTimerRunning: false,
                 timeLeft: 0
             });
            clearInterval(timerInterval);
            console.log("[FinishLine] Timer reached 0");
            io.emit('finishline_timer_ended'); // Notify clients
          } else {
             gameManager.updateFinishLineState({
                 timeLeft: newTime
             });
          }
        } catch (err) {
          console.error("[FinishLine] Timer interval error:", err);
          clearInterval(timerInterval);
        }
      }, 1000);
  };

  /**
   * Player: Confirm Star Usage
   */
  socket.on("player_finishline_confirm_star", async (data: { useStar: boolean }) => {
    try {
        await connectDB();
        const { useStar } = data;
        const match = await Match.findOne({ isActive: true });
        
        // Validation...
        if (!match?.finishLine.currentPack) return;

        const currentQ = match.finishLine.currentPack.questions[match.finishLine.currentQuestionIndex];
        
        // Update Star Status
        currentQ.starActivated = useStar;
        
        // Mark player as having used star if true
        if (useStar) {
            if (!match.finishLine.starUsedPlayerIds) match.finishLine.starUsedPlayerIds = [];
            match.finishLine.starUsedPlayerIds.push(match.finishLine.currentPack.ownerId);
        }

        // Transition to PLAYING
        gameManager.updateFinishLineState({
            currentPack: match.finishLine.currentPack,
            status: "PLAYING_QUESTION",
            starUsedPlayerIds: match.finishLine.starUsedPlayerIds
        });
        
        console.log(`[FinishLine] Star confirmed: ${useStar}. Transitioning to PLAYING.`);
        
        // Auto Start Logic
        handleAutoStartTimer(match, io);

    } catch (e) {
        console.error("Error confirming star:", e);
    }
  });

  /**
   * Client: Video Ended (Trigger Timer)
   */
  socket.on("client_finishline_video_ended", async () => {
      // Robustness: Check if timer already running
      const state = gameManager.getState();
      if (state.finishLine?.isTimerRunning) return; // Prevent double start

      console.log(`[FinishLine] Video ended event received. Starting timer.`);
      gameManager.updateFinishLineState({ isTimerRunning: true });
      startTimerInterval(io);
  });

  socket.on("player_finishline_answer", async (data: IAnswerData) => {
    try {
      await connectDB();
      const { playerId, answerText } = data;

      const match = await Match.findOne({ isActive: true });
      if (!match?.finishLine.currentPack) {
        socket.emit("error", { message: "No active pack" });
        return;
      }

      // Check timer constraint (Disabled per user request - handled on frontend)
      // if (!match.finishLine.isTimerRunning) {
      //   socket.emit("error", { message: "Timer not running" });
      //   return;
      // }

      const pack = match.finishLine.currentPack;
      const currentQ = pack.questions[match.finishLine.currentQuestionIndex];

      // Verify it's the owner's turn
      if (pack.ownerId !== playerId) {
        socket.emit("error", { message: "Not your turn" });
        return;
      }

      // Check if already answered
      if (currentQ.answer) {
        socket.emit("error", { message: "Already answered" });
        return;
      }

      // Validate player exists
      const player = await Player.findById(playerId);
      if (!player) {
         socket.emit("error", { message: "Player not found" });
         return;
      }

      // Store Pending Answer
      // Do NOT score yet
      currentQ.answer = {
        playerId,
        playerName: player.name,
        answerText,
        submittedAt: Date.now(),
        // isCorrect is intentionally undefined until judged
        pointsEarned: 0,
      };

      // Update state with answer, but keep timer running
      gameManager.updateFinishLineState({
          currentPack: match.finishLine.currentPack,
      });

      // Broadcast to MC for review
      io.emit("finishline_answer_needs_review", {
        playerId,
        playerName: player.name,
        answerText,
        questionIndex: match.finishLine.currentQuestionIndex
      });

      console.log(`[FinishLine] ${player.name} submitted answer: ${answerText} (Pending Review)`);

    } catch (error) {
      console.error("Error processing answer:", error);
      socket.emit("error", { message: "Failed to process answer" });
    }
  });

  /**
   * Player: Buzz for steal attempt
   */
  socket.on("player_finishline_buzz", async (data: IBuzzData) => {
    try {
      await connectDB();
      const { playerId } = data;

      const match = await Match.findOne({ isActive: true });
      if (!match?.finishLine.buzzerEnabled) {
        socket.emit("error", { message: "Buzzer not enabled" });
        return;
      }

      const player = await Player.findById(playerId);
      if (!player) {
        socket.emit("error", { message: "Player not found" });
        return;
      }

      // Check if already in queue
      const alreadyBuzzed = match.finishLine.buzzerQueue.some(
        (b: IBuzzerQueueItem) => b.playerId === playerId
      );
      if (alreadyBuzzed) {
        return;
      }

      // Add to queue
      match.finishLine.buzzerQueue.push({
        playerId,
        playerName: player.name,
        buzzTime: Date.now(),
      });

      gameManager.updateFinishLineState({
          buzzerQueue: match.finishLine.buzzerQueue
      });
      
      io.emit("finishline_buzz_registered", {
        playerId,
        playerName: player.name,
        position: match.finishLine.buzzerQueue.length,
      });

      console.log(`[FinishLine] ${player.name} buzzed (position ${match.finishLine.buzzerQueue.length})`);
    } catch (error) {
      console.error("Error processing buzz:", error);
    }
  });

  /**
   * MC: Select stealer from buzzer queue
   */
  socket.on("mc_finishline_select_stealer", async (data: { playerId: string }) => {
    try {
      await connectDB();
      const { playerId } = data;

      const match = await Match.findOne({ isActive: true });
      if (!match?.finishLine.buzzerQueue || match.finishLine.buzzerQueue.length === 0) {
        socket.emit("error", { message: "No buzzer queue" });
        return;
      }

      // Verify player is in queue
      const stealer = match.finishLine.buzzerQueue.find(
        (b: IBuzzerQueueItem) => b.playerId === playerId
      );

      if (!stealer) {
        socket.emit("error", { message: "Player not in buzzer queue" });
        return;
      }

      // Set selected stealer (will be used when they submit answer)
      gameManager.updateFinishLineState({
          selectedStealerId: playerId
      });
      
      io.emit("finishline_stealer_selected", {
        playerId: stealer.playerId,
        playerName: stealer.playerName,
      });

      console.log(`[FinishLine] ${stealer.playerName} selected to steal`);
    } catch (error) {
      console.error("Error selecting stealer:", error);
      socket.emit("error", { message: "Failed to select stealer" });
    }
  });

  /**
   * Player: Submit steal answer
   */
  /**
   * Player: Submit steal answer
   */
  socket.on("player_finishline_steal_answer", async (data: IAnswerData) => {
    console.log("[FinishLine] Received steal answer attempt:", data);
    try {
      await connectDB();
      const { playerId, answerText } = data;

      const match = await Match.findOne({ isActive: true });
      if (!match?.finishLine.currentPack) {
        socket.emit("error", { message: "No active pack" });
        return;
      }

      console.log(`[FinishLine] Debug Steal - Match Selected: ${match.finishLine.selectedStealerId}, Request Player: ${playerId}`);

      // Verify player is the selected stealer
      if (match.finishLine.selectedStealerId !== playerId) {
        console.warn(`[FinishLine] Steal rejected. Match says: ${match.finishLine.selectedStealerId}`);
        socket.emit("error", { message: "Not your turn to steal" });
        return;
      }

      const pack = match.finishLine.currentPack;
      // const currentQ = pack.questions[match.finishLine.currentQuestionIndex]; // Unused in pending step
      
      const player = await Player.findById(playerId);
      if (!player) {
        socket.emit("error", { message: "Player not found" });
        return;
      }

      const currentQ = pack.questions[match.finishLine.currentQuestionIndex];
      if (!currentQ.stealAttempts) currentQ.stealAttempts = [];
      
      const attemptIndex = currentQ.stealAttempts.push({
        playerId,
        playerName: player.name,
        answerText,
        // isCorrect undefined pending judge
        pointsEarned: 0,
        timestamp: Date.now(),
      }) - 1;

      console.log("[FinishLine] Steal attempts after push:", JSON.stringify(currentQ.stealAttempts));

      // Force Mongoose to recognize the change in Mixed type
      match.markModified('finishLine');
      await match.save(); // ✅ Ensure changes are persisted to DB
      
      // Update state
      // (This was part of previous steal answer logic)

      gameManager.updateFinishLineState({
          currentPack: match.finishLine.currentPack
      });

      // Broadcast to MC for review
      io.emit("finishline_steal_needs_review", {
        playerId,
        playerName: player.name,
        answerText,
        attemptIndex // Send index to identify which attempt to update
      });

      console.log(
        `[FinishLine] ${player.name} submitted steal answer: ${answerText} (Pending Review)`
      );
    } catch (error) {
      console.error("Error processing steal answer:", error);
      socket.emit("error", { message: "Failed to process steal answer" });
    }
  });

  /**
   * Player: Confirm/Skip Hope Star
   */
  socket.on("player_finishline_confirm_star", async (data: { useStar: boolean }) => {
       try {
           await connectDB();
           const { useStar } = data;
           
           const match = await Match.findOne({ isActive: true });
           if (!match?.finishLine.currentPack) return;

           const currentState = gameManager.getState();
           if (currentState.finishLine?.status !== "STAR_SELECTION") return;

           const playerId = currentState.finishLine.selectedPlayerId; // OR currentPack.ownerId
           if (!playerId) return;

           // Update Star Usage
           const newUsedList = [...(match.finishLine.starUsedPlayerIds || [])];
           
           if (useStar) {
                if (!newUsedList.includes(playerId)) {
                    newUsedList.push(playerId);
                }
                // Update Current Question Star Status
                const currentQ = match.finishLine.currentPack.questions[match.finishLine.currentQuestionIndex];
                currentQ.starActivated = true;
           } else {
               // Ensure it is false
               const currentQ = match.finishLine.currentPack.questions[match.finishLine.currentQuestionIndex];
               currentQ.starActivated = false;
           }

           // Update DB
           match.finishLine.starUsedPlayerIds = newUsedList;
           match.markModified("finishLine");
           await match.save();

           gameManager.updateFinishLineState({
               status: "PLAYING_QUESTION",
               starUsedPlayerIds: newUsedList,
               currentPack: match.finishLine.currentPack // Save questions update
           });

           io.emit("finishline_star_confirmed", { 
               playerId,
               useStar,
               questionIndex: match.finishLine.currentQuestionIndex
           });
           
           console.log(`[FinishLine] Player ${playerId} ${useStar ? "USED" : "SKIPPED"} Star.`);

       } catch (error) {
           console.error("Error confirming star:", error);
       }
  });

  /**
   * MC: Accept steal attempt (first in queue)
   */
  /**
   * MC: Judge Steal Attempt (Manual Logic)
   */
  socket.on("mc_finishline_judge_steal", async (data: { correct: boolean, attemptIndex?: number }) => {
    try {
      await connectDB();
      const { correct, attemptIndex } = data;

      const match = await Match.findOne({ isActive: true });
      if (!match?.finishLine.currentPack) {
        socket.emit("error", { message: "No active pack" });
        return;
      }

      const pack = match.finishLine.currentPack;
      const currentQ = pack.questions[match.finishLine.currentQuestionIndex];
      
      // Get the pending attempt
      if (!currentQ.stealAttempts || currentQ.stealAttempts.length === 0) {
           socket.emit("error", { message: "No steal attempts to judge" });
           return;
      }
      
      // Default to last attempt if index not provided (simplification for single steal flow)
      const index = attemptIndex !== undefined ? attemptIndex : currentQ.stealAttempts.length - 1;
      const attempt = currentQ.stealAttempts[index];
      
      if (!attempt) {
          socket.emit("error", { message: "Steal attempt not found" });
          return;
      }

      // Calculate scores
      const { stealer: stealerPoints, owner: ownerPoints } = calculateStealScores(
        currentQ.points,
        correct
      );

      // Update scores in DB
      await updatePlayerScore(attempt.playerId, "finish", stealerPoints);
      await updatePlayerScore(pack.ownerId, "finish", ownerPoints);
      io.emit("refresh_ranking"); // ✅ Trigger ranking refresh

      // Finalize attempt record
      attempt.isCorrect = correct;
      attempt.pointsEarned = stealerPoints;

      // Update buzzer state based on correctness
      if (correct) {
        // Correct answer - clear all buzzer state
        gameManager.updateFinishLineState({
          currentPack: match.finishLine.currentPack,
          buzzerQueue: [],
          buzzerEnabled: false,
          selectedStealerId: undefined
        });
      } else {
        // Wrong answer - remove this player from queue but keep buzzer enabled for others
        const updatedQueue = match.finishLine.buzzerQueue.filter(
          (buzz: { playerId: string; playerName: string; buzzTime: number }) => buzz.playerId !== attempt.playerId
        );
        
        gameManager.updateFinishLineState({
          currentPack: match.finishLine.currentPack,
          buzzerQueue: updatedQueue,
          buzzerEnabled: updatedQueue.length > 0, // Keep enabled if there are more players
          selectedStealerId: undefined // Clear to allow MC to select next player
        });
      }

      // Broadcast result
      io.emit("finishline_steal_result", {
        stealerId: attempt.playerId,
        stealerName: attempt.playerName,
        stealerAnswer: attempt.answerText,
        isCorrect: correct,
        stealerPointsChange: stealerPoints,
        ownerPointsChange: ownerPoints,
        correctAnswer: correct ? undefined : currentQ.referenceAnswer,
      });

      console.log(
        `[FinishLine] Judge Steal: ${attempt.playerName} - ${correct ? "ACCEPTED" : "REJECTED"} (${stealerPoints})`
      );
    } catch (error) {
      console.error("Error judging steal:", error);
      socket.emit("error", { message: "Failed to judge steal" });
    }
  });

  /**
   * MC: Reject steal (remove first from queue)
   */
  socket.on("mc_finishline_reject_steal", async () => {
    try {
      await connectDB();

      const match = await Match.findOne({ isActive: true });
      if (!match || match.finishLine.buzzerQueue.length === 0) {
        return;
      }

      const rejected = match.finishLine.buzzerQueue.shift();
      
      gameManager.updateFinishLineState({
          buzzerQueue: match.finishLine.buzzerQueue
      });

      io.emit("finishline_steal_rejected", {
        playerId: rejected.playerId,
        playerName: rejected.playerName,
      });

      console.log(`[FinishLine] Rejected steal from ${rejected.playerName}`);
    } catch (error) {
      console.error("Error rejecting steal:", error);
    }
  });
}
