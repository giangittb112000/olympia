import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import ObstacleResource from '@/server/models/ObstacleResource';

// Singleton Pattern: Always return the most recent or only set
export async function GET() {
  await connectDB();
  try {
    const resource = await ObstacleResource.findOne().sort({ createdAt: -1 });
    // If no resource, return null data but success true so frontend handles "Create New"
    return NextResponse.json({ success: true, data: resource }); 
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    if (!body.name || !body.finalCNV || !body.image) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    if (!body.rows || !Array.isArray(body.rows) || body.rows.length !== 4) {
         return NextResponse.json({ success: false, error: 'Must have exactly 4 rows' }, { status: 400 });
    }

    const obstacleData = {
        name: body.name,
        image: body.image,
        finalCNV: body.finalCNV.toUpperCase(),
        rows: body.rows.map((r: { question: string; answer: string }) => ({
            question: r.question,
            answer: r.answer.toUpperCase()
        }))
    };

    // Singleton: Upsert based on an empty filter (effectively replaces the first one it finds, or creates new)
    // However, findOneAndUpdate with {} might update a random one if multiple exist.
    // Better strategy: Delete all others? Or just maintain one ID?
    // Let's use deleteMany then create to be clean, or just update the latest one.
    
    const count = await ObstacleResource.countDocuments();
    let result;
    
    if (count > 0) {
        // Update the existing one (most recent)
        const latest = await ObstacleResource.findOne().sort({ createdAt: -1 });
        if (latest) {
             result = await ObstacleResource.findByIdAndUpdate(latest._id, obstacleData, { new: true });
        }
    } 
    
    if (!result) {
        result = await ObstacleResource.create(obstacleData);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
