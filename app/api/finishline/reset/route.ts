import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Match from '@/server/models/Match';
import FinishLineQuestionBank from '@/server/models/FinishLineQuestionBank';

export async function POST() {
  try {
    await connectDB();
    
    // Default state for Finish Line round
    const defaultState = {
      status: 'IDLE',
      selectedPlayerId: undefined,
      selectedPlayerName: undefined,
      availablePacks: [
          { packType: 40, count: 4 },
          { packType: 60, count: 4 },
          { packType: 80, count: 4 },
      ],
      currentPack: undefined,
      currentQuestionIndex: 0,
      isTimerRunning: false,
      timeLeft: 30,
      buzzerEnabled: false,
      buzzerQueue: [],
      bankId: undefined
    };
    
    // Reset Match State
    const updatedMatch = await Match.findOneAndUpdate(
      {}, // Target the singleton/active match
      { finishLine: defaultState },
      { upsert: true, new: true }
    );

    // Reset Question Bank Usage
    if (updatedMatch) {
        const bank = await FinishLineQuestionBank.findOne({ matchId: updatedMatch._id });
        if (bank) {
            await bank.resetUsage();
            console.log(`[FinishLine] Reset usage for bank ${bank._id}`);
        } else {
            console.warn(`[FinishLine] No Question Bank found for match ${updatedMatch._id}`);
        }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Finish Line round reset successfully'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error resetting Finish Line:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
