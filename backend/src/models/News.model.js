import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    summary: { type: String, required: true },
    category: { type: String, required: true },
    source: { type: String, default: '' },
    url: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    date: { type: Date, required: true },
    createdByAI: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export const News = mongoose.model('News', newsSchema);
