import { Server, Socket } from 'socket.io';
import GameManager from '../../game/GameManager';
import ObstacleResource from '../../models/ObstacleResource';
import Player from '../../models/Player';
import { POINTS, TIMERS, ObstacleState } from '../../game/GameConstants';

let timerInterval: NodeJS.Timeout | null = null;

export const obstacleManager = (io: Server, socket: Socket) => {

    // 1. SELECT ROW
    socket.on('mc_obstacle_select_row', async ({ rowIndex }: { rowIndex: number }) => {
        try {
            console.log(`[Obstacle] Select Row ${rowIndex}`);
            
            const state = GameManager.getState();
            // Check if already solved
            if (state.obstacle?.rowContents?.[rowIndex]) {
                return socket.emit('error', 'Hàng ngang này đã được giải quyết!');
            }
            
            // Fetch Resource (Singleton Logic)
            const resource = await ObstacleResource.findOne().sort({ createdAt: -1 });
            if (!resource) return socket.emit('error', 'Chưa có bộ câu hỏi nào được tạo!');

            const row = resource.rows[rowIndex];
            if (!row) return socket.emit('error', 'Hàng ngang không tồn tại!');

            // Update State
            GameManager.updateObstacleState({
                status: 'SHOW_ROW',
                currentRowIndex: rowIndex,
                currentRowQuestion: row.question,
                currentRowLength: row.answer.length,
                answers: {}, // Reset answers for new row
                grading: {} // Reset grading
            });
            
            // Persist finding current row in DB? Maybe not needed strictly, state is enough.
            // But we might want to update resource.currentRowIndex if we want persistence across reboot? 
            // Let's rely on GameState for now.
            io.emit('gamestate_sync', GameManager.getState());

        } catch (e) {
            console.error(e);
        }
    });

    // 2. START TIMER (15s)
    socket.on('mc_obstacle_start_timer', () => {
        const state = GameManager.getState();
        if (state.phase !== 'OBSTACLES') return;

        console.log('[Obstacle] Timer Started');
        GameManager.updateObstacleState({ status: 'THINKING', timer: TIMERS.OBSTACLE.ROW_THINKING });

        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            const currentState = GameManager.getState();
            // Safety check
            if (currentState.phase !== 'OBSTACLES' || currentState.obstacle?.status !== 'THINKING') {
                if(timerInterval) clearInterval(timerInterval);
                return;
            }

            const newTime = (currentState.obstacle?.timer || 0) - 1;
            
            if (newTime < 0) {
                 // FINISH TIMER -> SHOW ANSWERS 
                 if(timerInterval) clearInterval(timerInterval);
                 
                 // Mark row as finished in results?
                 // Wait, rowResults logic is complex (isSolved etc).
                 // Actually, just changing status to ROW_GRADING is what the UI normally uses to show answers.
                 // The User wants "mark keyword as done". 
                 // Maybe we should verify if answers are actually being saved here?
                 // No, answers are realtime.
                 
                 console.log('[Obstacle] Timer Finished -> ROW_GRADING');
                 GameManager.updateObstacleState({ status: 'ROW_GRADING' }); 
            } else {
                 // console.log(`[Timer] ${newTime}`); // Reduce noise
                 GameManager.updateObstacleState({ timer: newTime });
            }
            
            // Broadcast time tick
            io.emit('gamestate_sync', GameManager.getState());
        }, 1000);
    });

    // 3. PLAYER ANSWER (Re-implemented below with payload)
    // Removed duplicate socket.on to fix lint error

    // RE-IMPLEMENTing 3 with payload assumption
    socket.on('player_obstacle_answer', ({ playerId, answer }: { playerId: string, answer: string }) => {
        const state = GameManager.getState();
        console.log(`[Obstacle DEBUG] Player ${playerId} answer attempt: ${answer} | Phase: ${state.phase} | Status: ${state.obstacle?.status}`);

        if (state.phase !== 'OBSTACLES' || state.obstacle?.status !== 'THINKING') {
            console.log(`[Obstacle DEBUG] Rejected answer due to wrong phase/status`);
            return;
        }
        
        if (state.obstacle?.eliminatedPlayerIds?.includes(playerId)) {
             console.log(`[Obstacle DEBUG] Rejected answer from eliminated player ${playerId}`);
             return; 
        }

        console.log(`[Obstacle] Accepted answer from ${playerId}: ${answer}`);
        const currentAnswers = { ...state.obstacle?.answers };
        currentAnswers[playerId] = answer.trim().toUpperCase();

        GameManager.updateObstacleState({ answers: currentAnswers });
        
        // Broadcast immediately to ensure MC sees it?
        // GameManager.updateObstacleState should trigger broadcast if implemented correctly.
        // Let's verify if gameManager emits update.
        io.emit('gamestate_sync', GameManager.getState());
    });


    // 4. GRADE ROW
    socket.on('mc_obstacle_grade_player', async ({ playerId, isCorrect }: { playerId: string, isCorrect: boolean }) => {
         // This is usually done AFTER timer ends (ROW_GRADING phase)
         const state = GameManager.getState();
         if (state.phase !== 'OBSTACLES') return;

         const currentGrading = { ...(state.obstacle?.grading || {}) };
         currentGrading[playerId] = isCorrect ? 'CORRECT' : 'WRONG';
         
         // Update Grading State FIRST
         GameManager.updateObstacleState({ grading: currentGrading });

         if (isCorrect) {
             const points = POINTS.OBSTACLE.ROW_CORRECT;
             await Player.findByIdAndUpdate(playerId, { $inc: { "scores.obstacle": points, "scores.total": points }});
             
             // AUTO-REVEAL PIECE for this row
             const currentRow = state.obstacle?.currentRowIndex ?? -1;
             if (currentRow >= 0 && currentRow < 4) {
                 const pieces = [...(state.obstacle?.revealedPieces || [])];
                 pieces[currentRow] = true;

                 // Reveal Row Content
                 const newRowContents = [...(state.obstacle?.rowContents || [])];
                 // If lengths match, good. If not init, we fetch
                 const resource = await ObstacleResource.findOne().sort({ createdAt: -1 });
                 if (resource && resource.rows[currentRow]) {
                      newRowContents[currentRow] = resource.rows[currentRow].answer;
                 }
                 
                 GameManager.updateObstacleState({ revealedPieces: pieces, rowContents: newRowContents });
             }

             // IMPLICIT SYNC: We must broadcast the new state so clients (Player/Monitor) see the revealed content.
             // refresh_ranking handles scores, but not the obstacle board state.
             io.emit('gamestate_sync', GameManager.getState());
             io.emit('refresh_ranking');
         } else {
             // Even if wrong, we updated grading status, so sync.
             io.emit('gamestate_sync', GameManager.getState());
         }
    });

    // 4.5. FINISH ROW (Show Answer but NO Image Piece - for when no one is correct)
    socket.on('mc_obstacle_finish_row', async () => {
         const state = GameManager.getState();
         const currentRow = state.obstacle?.currentRowIndex ?? -1;

         if (state.phase !== 'OBSTACLES' || currentRow < 0) return;

         try {
             // Fetch Resource to get the answer
             const resource = await ObstacleResource.findOne().sort({ createdAt: -1 });
             if (resource && resource.rows[currentRow]) {
                 const newRowContents = [...(state.obstacle?.rowContents || [])];
                 newRowContents[currentRow] = resource.rows[currentRow].answer;

                 // Update State: Content revealed, but Piece remains hidden (revealedPieces not touched for this index)
                 // Set status back to IDLE so we can pick next row
                 GameManager.updateObstacleState({ 
                     rowContents: newRowContents,
                     status: 'IDLE',
                     currentRowIndex: -1, // Reset active row
                     currentRowQuestion: undefined,
                     currentRowLength: undefined,
                     answers: {}, // Clear answers
                     grading: {}  // Clear grading
                 });

                 console.log(`[Obstacle] Force Finished Row ${currentRow}. Content shown, Image hidden.`);
                 io.emit('gamestate_sync', GameManager.getState());
             }
         } catch(e) {
             console.error("Error finishing row:", e);
         }
    });

    // 4.6. DISMISS ROW (Mark as Played/Skipped but DO NOT Reveal Content)
    socket.on('mc_obstacle_dismiss_row', async () => {
         const state = GameManager.getState();
         const currentRow = state.obstacle?.currentRowIndex ?? -1;

         if (state.phase !== 'OBSTACLES' || currentRow < 0) return;

         try {
             const newRowResults = [...(state.obstacle?.rowResults || [])];
             newRowResults[currentRow] = { isSolved: false, answer: "SKIPPED" };

             GameManager.updateObstacleState({ 
                 rowResults: newRowResults,
                 status: 'IDLE',
                 currentRowIndex: -1, // Reset active row
                 currentRowQuestion: undefined,
                 currentRowLength: undefined,
                 answers: {}, // Clear answers
                 grading: {}  // Clear grading
             });

             console.log(`[Obstacle] Dismissed Row ${currentRow}. Marked as SKIPPED.`);
             io.emit('gamestate_sync', GameManager.getState());
         } catch(e) {
             console.error("Error dismissing row:", e);
         }
    });

    // 4.7 MARK ROW FINISHED (Manual by Index)
    socket.on('mc_obstacle_mark_row_finished', ({ rowIndex }: { rowIndex: number }) => {
        const state = GameManager.getState();
        if (state.phase !== 'OBSTACLES') return;
        
        try {
            const newRowResults = [...(state.obstacle?.rowResults || [])];
            newRowResults[rowIndex] = { isSolved: false, answer: "SKIPPED" };
            
            let update: Partial<ObstacleState> = { rowResults: newRowResults };
            
            // If this was the active row, reset to IDLE
            if (state.obstacle?.currentRowIndex === rowIndex) {
                update = {
                    ...update,
                    status: 'IDLE',
                    currentRowIndex: -1,
                    currentRowQuestion: undefined,
                    currentRowLength: undefined,
                    answers: {}, 
                    grading: {}
                };
            }
            
            GameManager.updateObstacleState(update);
            io.emit('gamestate_sync', GameManager.getState());
            console.log(`[Obstacle] Manually marked row ${rowIndex} as FINISHED (SKIPPED).`);
        } catch (e) {
            console.error(e);
        }
    });

    // 5. OPEN PIECE (Triggered by MC if at least one correct, or manually)
    socket.on('mc_obstacle_open_piece', async ({ pieceIndex }: { pieceIndex: number }) => {
         const state = GameManager.getState();
         const pieces = [...(state.obstacle?.revealedPieces || [])];
         pieces[pieceIndex] = true; // 0-3 for corners, 4 for Center
         
         // If corner piece (0-3), reveal content
         if (pieceIndex < 4) {
             const resource = await ObstacleResource.findOne().sort({ createdAt: -1 });
             if (resource) {
                 // Update Row Content
                 const newRowContents = [...(state.obstacle?.rowContents || [])];
                 if (resource.rows[pieceIndex]) {
                      newRowContents[pieceIndex] = resource.rows[pieceIndex].answer;
                 }
                 GameManager.updateObstacleState({ revealedPieces: pieces, rowContents: newRowContents });
             }
         } else {
             GameManager.updateObstacleState({ revealedPieces: pieces });
         }
         io.emit('gamestate_sync', GameManager.getState());
    });

    // 6. CNV BUZZER
    socket.on('player_obstacle_buzz', ({ playerId }: { playerId: string }) => {
        const state = GameManager.getState();
        if (state.phase !== 'OBSTACLES') return;
        
        if (state.obstacle?.eliminatedPlayerIds?.includes(playerId)) return;

        // Add to queue
        const queue = [...(state.obstacle?.buzzerQueue || [])];
        
        // Prevent double buzz
        if (queue.some(b => b.playerId === playerId)) return;

        queue.push({ playerId, timestamp: Date.now(), isProcessed: false });
        
        // Lock system? Usually we process first one.
        // In GameConstants, we have `cnvLocked`. 
        // If queue was empty, lock it?
        let locked = state.obstacle?.cnvLocked || false;
        if (queue.length === 1) locked = true;

        GameManager.updateObstacleState({ buzzerQueue: queue, cnvLocked: locked, status: 'CNV_GUESSING' });
        
        // Pause Row Timer if running?
        if (timerInterval) clearInterval(timerInterval);
    });

    // 7. SOLVE CNV (MC Decision)
    socket.on('mc_obstacle_solve_cnv', async ({ playerId, isCorrect }: { playerId: string, isCorrect: boolean }) => {
         if (timerInterval) clearInterval(timerInterval);
         const state = GameManager.getState();
         // Calculate Score Tier
         const revealedCount = state.obstacle?.revealedPieces.slice(0, 4).filter(Boolean).length || 0;
         let points = 0;
         
         if (isCorrect) {
             if (revealedCount === 0) points = POINTS.OBSTACLE.OBSTACLE_CORRECT_BEFORE_2;
             else if (revealedCount === 1) points = POINTS.OBSTACLE.OBSTACLE_CORRECT_AFTER_2;
             else if (revealedCount === 2) points = POINTS.OBSTACLE.OBSTACLE_CORRECT_AFTER_3;
             else points = POINTS.OBSTACLE.OBSTACLE_CORRECT_LAST;

             await Player.findByIdAndUpdate(playerId, { $inc: { "scores.obstacle": points, "scores.total": points }});
             
             // FETCH FULL RESOURCE TO REVEAL EVERYTHING
             const resource = await ObstacleResource.findOne().sort({ createdAt: -1 });
             
             // Ensure state.obstacle exists before accessing
             if (!state.obstacle) return;

             const fullRowContents = [...(state.obstacle.rowContents || [])]; 
             
             // Better to overwrite with correct answers from DB to ensure "show hết từ khóa"
             if (resource) {
                 resource.rows.forEach((row: { answer: string }, idx: number) => {
                     fullRowContents[idx] = row.answer;
                 });
             }
             
             // WINNER -> FINISH ROUND
             GameManager.updateObstacleState({ 
                 status: 'FINISHED', 
                 cnvLocked: true, 
                 imageRevealed: true, // Open full image
                 revealedPieces: [true, true, true, true, true], // Open Top-Left, TR, BR, BL, Center
                 rowContents: fullRowContents, // Show all keywords
                 finalCNV: state.obstacle.finalCNV, // Ensure it's shown
                 buzzerQueue: [] // CLEAR QUEUE to close Popup
             });
             
             io.emit('gamestate_sync', GameManager.getState());
             io.emit('refresh_ranking');

             // Update Resource Status to COMPLETED
             if (resource) {
                 resource.status = 'COMPLETED';
                 await resource.save();
                 console.log('[Obstacle] Resource marked as COMPLETED');
             }

         } else {
             // WRONG -> ELIMINATE
             const eliminated = [...(state.obstacle?.eliminatedPlayerIds || [])];
             if (!eliminated.includes(playerId)) {
                 eliminated.push(playerId);
             }
             
             // Mark buzzer as processed
             const queue = (state.obstacle?.buzzerQueue || []).map(b => b.playerId === playerId ? { ...b, isProcessed: true } : b);
             
             GameManager.updateObstacleState({ 
                 eliminatedPlayerIds: eliminated,
                 buzzerQueue: queue,
                 cnvLocked: false, // Unlock for others
                 status: 'IDLE' // Back to IDLE so MC can select next row
             });
             
             // Explicitly broadcast to ensure client updates elimination UI
             io.emit('gamestate_sync', GameManager.getState());
         }
    });
    
    // 8. OPEN IMAGE (Manual)
    socket.on('mc_obstacle_show_image', () => {
         GameManager.updateObstacleState({ imageRevealed: true });
    });

    // 9. RESET ROUND (Fix for API Route State Desync)
    socket.on('mc_obstacle_reset', async () => {
        try {
            const newState = {
                status: 'IDLE' as const,
                currentImage: '',
                imageRevealed: false,
                revealedPieces: [false, false, false, false, false] as boolean[],
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

            // Update Memory & Broadcast
            GameManager.updateObstacleState(newState);

            // Fetch Resource to reset its status? 
            // Optional: If we want to allow re-playing the same resource, we might need to set it back to NOT_STARTED?
            // For now, let's just ensure the GAME STATE is clean.
            
            console.log('[Obstacle] Round State Reset via Socket');
            io.emit('mc_notification', { message: 'Reset vòng thi thành công!', type: 'success' });

        } catch (e) {
            console.error(e);
            socket.emit('error', 'Lỗi khi reset vòng thi');
        }
    });
};
