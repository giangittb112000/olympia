import mongoose, { Schema, Document } from "mongoose";

/**
 * Interface for individual questions in the Finish Line Round
 * Media fields are OPTIONAL - questions can be text-only
 */
export interface IQuestion {
  questionText: string;
  questionDescription?: string;
  mediaType?: "IMAGE" | "VIDEO" | "AUDIO"; // Optional
  mediaUrl?: string; // Optional - local path like /uploads/finishline/xxx.mp4
  referenceAnswer: string;
  points: 10 | 20 | 30;
  isUsed: boolean;
}

/**
 * Main Question Bank document
 * Stores questions for the Finish Line Round, organized by point value
 */
export interface IFinishLineQuestionBank extends Document {
  matchId: mongoose.Types.ObjectId;
  questions10pt: IQuestion[];
  questions20pt: IQuestion[];
  questions30pt: IQuestion[];
  createdBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  resetUsage(): Promise<void>;
  getUsageStats(): {
    total10pt: number;
    used10pt: number;
    total20pt: number;
    used20pt: number;
    total30pt: number;
    used30pt: number;
  };
}

const QuestionSchema = new Schema<IQuestion>(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    questionDescription: {
      type: String,
      trim: true,
    },
    mediaType: {
      type: String,
      enum: ["IMAGE", "VIDEO", "AUDIO"],
      required: false, // ✅ Optional - không phải câu nào cũng cần media
    },
    mediaUrl: {
      type: String,
      required: false, // ✅ Optional
    },
    referenceAnswer: {
      type: String,
      required: true,
      trim: true,
    },
    points: {
      type: Number,
      required: true,
      enum: [10, 20, 30],
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const FinishLineQuestionBankSchema = new Schema(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true,
    },
    questions10pt: {
      type: [QuestionSchema],
      default: [],
      validate: {
        validator: function (v: IQuestion[]) {
          return v.length >= 3;
        },
        message: "Must have at least 3 questions for 10pt category",
      },
    },
    questions20pt: {
      type: [QuestionSchema],
      default: [],
      validate: {
        validator: function (v: IQuestion[]) {
          return v.length >= 3;
        },
        message: "Must have at least 3 questions for 20pt category",
      },
    },
    questions30pt: {
      type: [QuestionSchema],
      default: [],
      validate: {
        validator: function (v: IQuestion[]) {
          return v.length >= 3;
        },
        message: "Must have at least 3 questions for 30pt category",
      },
    },
    createdBy: String,
    notes: String,
  },
  { timestamps: true }
);

// Method: Reset all isUsed flags (for new game)
FinishLineQuestionBankSchema.methods.resetUsage = async function () {
  this.questions10pt.forEach((q: IQuestion) => (q.isUsed = false));
  this.questions20pt.forEach((q: IQuestion) => (q.isUsed = false));
  this.questions30pt.forEach((q: IQuestion) => (q.isUsed = false));
  
  // Explicitly mark arrays as modified to ensure updates are saved
  this.markModified('questions10pt');
  this.markModified('questions20pt');
  this.markModified('questions30pt');
  
  return this.save();
};

// Method: Get usage statistics
FinishLineQuestionBankSchema.methods.getUsageStats = function () {
  return {
    total10pt: this.questions10pt.length,
    used10pt: this.questions10pt.filter((q: IQuestion) => q.isUsed).length,
    total20pt: this.questions20pt.length,
    used20pt: this.questions20pt.filter((q: IQuestion) => q.isUsed).length,
    total30pt: this.questions30pt.length,
    used30pt: this.questions30pt.filter((q: IQuestion) => q.isUsed).length,
  };
};

export default mongoose.models.FinishLineQuestionBank ||
  mongoose.model<IFinishLineQuestionBank>(
    "FinishLineQuestionBank",
    FinishLineQuestionBankSchema
  );
