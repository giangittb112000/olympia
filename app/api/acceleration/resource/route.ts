import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import AccelerationResource from '@/server/models/AccelerationResource';

// POST: Create or Update resource
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    // Validate 4 questions
    if (!body.questions || body.questions.length !== 4) {
      return NextResponse.json(
        { error: 'Must provide exactly 4 questions' },
        { status: 400 }
      );
    }
    
    let resource;
    
    // Update existing resource if resourceId is provided
    if (body.resourceId) {
      resource = await AccelerationResource.findByIdAndUpdate(
        body.resourceId,
        { questions: body.questions },
        { new: true, runValidators: true }
      );
      
      if (!resource) {
        return NextResponse.json(
          { error: 'Resource not found' },
          { status: 404 }
        );
      }
    } else {
      // Create new resource
      resource = new AccelerationResource({ questions: body.questions });
      await resource.save();
    }
    
    return NextResponse.json({
      success: true,
      resourceId: resource._id,
      isUpdate: !!body.resourceId
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET: Get latest resource
export async function GET() {
  try {
    await connectDB();
    const resource = await AccelerationResource.findOne()
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ resource });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
