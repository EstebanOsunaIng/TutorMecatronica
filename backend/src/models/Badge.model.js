import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema(
  {
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    iconUrl: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export const Badge = mongoose.model('Badge', badgeSchema);
