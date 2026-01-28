import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Player from '@/server/models/Player';

export async function POST(req: Request) {
  await connectDB();
  
  try {
    const { id, password } = await req.json();

    if (!id || !password) {
        return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }

    const player = await Player.findById(id);
    if (!player) {
        return NextResponse.json({ success: false, error: 'Player not found' }, { status: 404 });
    }

    // Check password (simple string comparison as requested)
    // Access meta via player.get('meta') or directly depending on mongoose typings, usually player.meta works if typed.
    // Since schema defines meta as Object, we check it.
    
    const storedPassword = player.meta?.password;

    if (!storedPassword) {
         // If no password set, maybe allow? Or deny?
         // Requirement says "check password". If no password set, effectively they can't login via this method unless we define a default.
         // Let's assume if no password set, they can't login via this specific flow, or maybe any password works?
         // User said "add password for each user". So we expect it to be there.
         return NextResponse.json({ success: false, error: 'Password not set for this user' }, { status: 401 });
    }

    if (storedPassword !== password) {
        return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 });
    }

    return NextResponse.json({ success: true, valid: true });

  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ success: false, error: 'Auth failed' }, { status: 500 });
  }
}
