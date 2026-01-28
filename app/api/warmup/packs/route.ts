import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import WarmUpPack from '@/server/models/WarmUpPack';

export async function GET() {
  await connectDB();
  try {
    const packs = await WarmUpPack.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: packs });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch packs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    if (!body.name) {
        return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const newPack = await WarmUpPack.create({
        name: body.name,
        questions: body.questions || []
    });

    return NextResponse.json({ success: true, data: newPack });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to create pack' }, { status: 500 });
  }
}
