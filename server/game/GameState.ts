export type GamePhase = 
  | 'IDLE'          // Waiting/Welcome Screen
  | 'WARMUP'        // Khởi Động
  | 'OBSTACLES'     // Vượt Chướng Ngại Vật
  | 'ACCELERATION'  // Tăng Tốc
  | 'FINISH';       // Về Đích

import { AccelerationState, FinishLineState, ObstacleState, WarmUpState } from "./GameConstants";
export type { AccelerationState, FinishLineState, ObstacleState, WarmUpState }; // Re-export

export interface GameState {
  phase: GamePhase;
  roundId?: string;
  
  // Global State
  activePlayerId?: string;
  timestamp: number;

  // Round specific states
  warmUp?: WarmUpState;
  obstacle?: ObstacleState;
  acceleration?: AccelerationState;
  // finish property removed
  finishLine?: FinishLineState; // NEW Finish Line Round
}
