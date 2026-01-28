import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import WarmUpPack from '@/server/models/WarmUpPack';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const resolvedParams = await params;
  try {
    const pack = await WarmUpPack.findById(resolvedParams.id);
    if (!pack) {
        return NextResponse.json({ success: false, error: 'Pack not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: pack });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Fetch failed' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const resolvedParams = await params;
  try {
    const body = await req.json();
    const pack = await WarmUpPack.findByIdAndUpdate(
        resolvedParams.id, 
        { $set: body },
        { new: true }
    );
    if (!pack) {
        return NextResponse.json({ success: false, error: 'Pack not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: pack });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const resolvedParams = await params;
  try {
    const pack = await WarmUpPack.findByIdAndDelete(resolvedParams.id);
    if (!pack) {
        return NextResponse.json({ success: false, error: 'Pack not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }
}
