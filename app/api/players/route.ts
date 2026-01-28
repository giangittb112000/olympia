import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { createPlayer, getAllPlayers, getOfflinePlayers } from '@/server/services/playerService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  await connectDB();
  
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  try {
    let players;
    if (status === 'offline') {
        players = await getOfflinePlayers();
    } else {
        players = await getAllPlayers();
    }
    return NextResponse.json({ success: true, data: players });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch players' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    
    // Store password in meta if provided
    const playerData = {
        name: body.name,
        meta: body.password ? { password: body.password } : {}
    };

    const player = await createPlayer(playerData);
    return NextResponse.json({ success: true, data: player }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create player' }, { status: 400 });
  }
}
