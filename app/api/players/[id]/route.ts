import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { deletePlayer, updatePlayer, getPlayerById } from '@/server/services/playerService';

// Handle parameters correctly for Next.js 15+ 
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // params is now a Promise in newer Next.js versions
) {
  await connectDB();
  const resolvedParams = await params;
  const id = resolvedParams.id;

  try {
    const body = await req.json();
    const player = await updatePlayer(id, body);
    
    if (!player) {
      return NextResponse.json({ success: false, error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: player });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update player' }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const resolvedParams = await params;
  const id = resolvedParams.id;

  try {
    const deleted = await deletePlayer(id);
    
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete player' }, { status: 400 });
  }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    await connectDB();
    const resolvedParams = await params;
    const id = resolvedParams.id;
  
    try {
      const player = await getPlayerById(id);
      
      if (!player) {
        return NextResponse.json({ success: false, error: 'Player not found' }, { status: 404 });
      }
  
      return NextResponse.json({ success: true, data: player });
    } catch (error) {
        console.error("Error fetching player:", error);
        return NextResponse.json({ success: false, error: 'Failed to fetch player' }, { status: 400 });
    }
  }
