import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  socketId: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['mc', 'player', 'guest', 'monitor'],
    required: true,
  },
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null,
  },
  connectedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
