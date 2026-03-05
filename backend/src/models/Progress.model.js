import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    currentLevelOrder: { type: Number, default: 1 },
    levelsCompleted: { type: [Number], default: [] },
    moduleProgressPercent: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    timeSpentSeconds: { type: Number, default: 0 }
  },
  { timestamps: true, versionKey: false }
);

progressSchema.index({ userId: 1, moduleId: 1 }, { unique: true });

export const Progress = mongoose.model('Progress', progressSchema);
