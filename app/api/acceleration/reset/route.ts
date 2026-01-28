import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Match from '@/server/models/Match';

export async function POST() {
  try {
    await connectDB();
    
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
      status: 'IDLE',
      resourceId: undefined
    };
    
    await Match.findOneAndUpdate(
      {},
      { accelerationState: defaultState },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Acceleration round reset successfully'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
