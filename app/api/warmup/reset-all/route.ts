import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import WarmUpPack from '@/server/models/WarmUpPack';

export async function POST() {
    await connectDB();
    try {
        // Find ALL packs that have been played (optimization) and reset them
        const result = await WarmUpPack.updateMany(
            {}, // Filter: All documents
            { 
                $set: { 
                    playedBy: null, 
                    isCompleted: false, 
                    currentQuestionIndex: 0 
                } 
            }
        );

        return NextResponse.json({ 
            success: true, 
            message: `Reset complete. Modified ${result.modifiedCount} packs.` 
        });
    } catch (error) {
        console.error('Global Reset Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
