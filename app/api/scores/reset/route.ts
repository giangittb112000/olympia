import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { resetPlayerScores } from '@/server/services/playerService';

export async function POST(req: Request) {
  await connectDB();
  
  try {
    const body = await req.json();
    const { round, all } = body;

    // Optional protection: Check if requester is MC (via header or session check if implemented)
    // For now, simpler implementation as open endpoint within internal network

    if (all) {
        await resetPlayerScores();
        return NextResponse.json({ success: true, message: 'All scores reset' });
    }

    if (round) {
        await resetPlayerScores(round);
        return NextResponse.json({ success: true, message: `Scores for ${round} reset` });
    }

    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });

  } catch (error) {
    console.error("Score Reset Error:", error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
