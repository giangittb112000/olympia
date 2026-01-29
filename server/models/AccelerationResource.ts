import mongoose, { Schema, Document } from 'mongoose';

export interface IAccelerationQuestion {
  questionNumber: 1 | 2 | 3 | 4;
  mediaType?: 'VIDEO' | 'IMAGE';
  mediaUrl?: string;
  questionText: string;
  questionDescription?: string;
  timeLimit: number;
  referenceAnswer?: string;
}

export interface IAccelerationResource extends Document {
  questions: IAccelerationQuestion[];
  createdBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccelerationQuestionSchema = new Schema({
  questionNumber: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4]
  },
  mediaType: {
    type: String,
    required: false,
    enum: ['VIDEO', 'IMAGE']
  },
  mediaUrl: {
    type: String,
    required: false
  },
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  questionDescription: {
    type: String,
    trim: true
  },
  timeLimit: {
    type: Number,
    required: true,
    min: 15,
    max: 60,
    default: 30
  },
  referenceAnswer: {
    type: String,
    trim: true
  }
}, { _id: false });

const AccelerationResourceSchema = new Schema({
  questions: {
    type: [AccelerationQuestionSchema],
    required: true,
    validate: {
      validator: function(v: IAccelerationQuestion[]) {
        return v.length === 4;
      },
      message: 'Must have exactly 4 questions'
    }
  },
  createdBy: String,
  notes: String
}, { timestamps: true });

export default mongoose.models.AccelerationResource || 
  mongoose.model<IAccelerationResource>('AccelerationResource', AccelerationResourceSchema);
