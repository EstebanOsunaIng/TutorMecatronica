import mongoose from 'mongoose';

const rankingSnapshotSchema = new mongoose.Schema(
  {
    generatedAt: { type: Date, default: Date.now },
    top: { type: Array, default: [] }
  },
  { versionKey: false }
);

export const RankingSnapshot = mongoose.model('RankingSnapshot', rankingSnapshotSchema);
