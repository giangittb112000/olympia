import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Match from '@/server/models/Match';
import ObstacleResource from '@/server/models/ObstacleResource';
import GameManager from '@/server/game/GameManager';
import { ObstacleState } from '@/server/game/GameConstants';

export async function POST() {
    await connectDB();
    try {
        const newState: { obstacle: ObstacleState } = {
            obstacle: {
                status: 'IDLE',
                currentImage: '',
                imageRevealed: false,
                revealedPieces: [false, false, false, false, false],
                finalCNV: '',
                currentRowIndex: -1,
                rowLengths: [],
                rowContents: [],
                rowResults: [],
                timer: 15,
                answers: {},
                grading: {},
                cnvLocked: false,
                buzzerQueue: [],
                eliminatedPlayerIds: []
            }
        };

        // 1. Reset ALL Obstacle Resources (Critical for re-play)
        await ObstacleResource.updateMany({}, {
            $set: {
                status: 'NOT_STARTED',
                currentRowIndex: -1,
                "rows.$[].isSolved": false
            }
        });

        // 2. Update DB Match State
        await Match.findOneAndUpdate(
            { isActive: true },
            { $set: newState },
            { new: true }
        );

        // 3. Update GameManager Memory
        GameManager.updateObstacleState(newState.obstacle);

        return NextResponse.json({ success: true, message: 'Obstacle state & resources reset successfully' });
    } catch (error) {
        console.error('Obstacle Reset Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to reset obstacle state' }, { status: 500 });
    }
}
