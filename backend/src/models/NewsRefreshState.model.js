import mongoose from 'mongoose';

const newsRefreshStateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    lastRefreshAt: { type: Date },
    lastAttemptAt: { type: Date },
    lastStatus: { type: String, enum: ['idle', 'success', 'failed'], default: 'idle' },
    lastError: { type: String, default: '' }
  },
  { versionKey: false }
);

export const NewsRefreshState = mongoose.model('NewsRefreshState', newsRefreshStateSchema);
