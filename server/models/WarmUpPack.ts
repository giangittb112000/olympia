import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  content: { type: String, required: true },
  description: { type: String, default: "" }, // Đáp án hoặc mô tả phụ
}, { _id: false });

const WarmUpPackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  questions: [QuestionSchema],
  
  // Game State Tracking
  playedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null }, // 1-1 Constraint
  isCompleted: { type: Boolean, default: false },
  currentQuestionIndex: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.WarmUpPack || mongoose.model('WarmUpPack', WarmUpPackSchema);
