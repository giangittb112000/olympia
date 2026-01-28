import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { updatePlayerScore } from '@/server/services/playerService';

export async function POST(req: Request) {
  await connectDB();
  
  try {
    const body = await req.json();
    const { playerId, round, score } = body;

    if (!playerId || !round || score === undefined) {
        return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    const updatedPlayer = await updatePlayerScore(playerId, round, score);
    
    if (!updatedPlayer) {
        return NextResponse.json({ success: false, error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedPlayer });

  } catch (error) {
    console.error("Score Update Error:", error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
