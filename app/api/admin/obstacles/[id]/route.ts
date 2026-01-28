import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import ObstacleResource from '@/server/models/ObstacleResource';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
  await connectDB();
  try {
    const body = await req.json();
    const { id } = params;

    const updateData = {
        name: body.name,
        image: body.image,
        finalCNV: body.finalCNV?.toUpperCase(),
        rows: body.rows?.map((r: { question: string; answer: string }) => ({
            question: r.question,
            answer: r.answer.toUpperCase()
        }))
    };

    const updated = await ObstacleResource.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updated) {
        return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    await connectDB();
    try {
        const { id } = params;
        const deleted = await ObstacleResource.findByIdAndDelete(id);
        
        if (!deleted) {
            return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Deleted' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
