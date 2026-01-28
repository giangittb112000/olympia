import mongoose, { Schema, Document } from 'mongoose';

export interface IObstacleResource extends Document {
    name: string;
    image: string; // URL or Base64
    finalCNV: string;
    rows: {
        question: string;
        answer: string;
        isSolved: boolean; // Persist row completion
    }[];
    // State Tracking
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    currentRowIndex: number; // -1 if no row selected
    createdAt: Date;
    updatedAt: Date;
}

const ObstacleResourceSchema = new Schema<IObstacleResource>({
    name: { type: String, required: true },
    image: { type: String, required: true },
    finalCNV: { type: String, required: true },
    rows: [{
        question: { type: String, required: true },
        answer: { type: String, required: true },
        isSolved: { type: Boolean, default: false }
    }],
    status: { type: String, default: 'NOT_STARTED', enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] },
    currentRowIndex: { type: Number, default: -1 },
}, { timestamps: true });

// Prevent overwrite during hot-reload
const ObstacleResource = mongoose.models.ObstacleResource || mongoose.model<IObstacleResource>('ObstacleResource', ObstacleResourceSchema);

export default ObstacleResource;
