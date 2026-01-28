import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for this player.'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  meta: {
    type: Object,
    default: {},
  },
  scores: {
    warmup: { type: Number, default: 0 },
    obstacles: { type: Number, default: 0 },
    acceleration: { type: Number, default: 0 },
    finish: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
}, { timestamps: true });

export default mongoose.models.Player || mongoose.model('Player', PlayerSchema);
