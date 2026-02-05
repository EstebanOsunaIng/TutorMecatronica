import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    level: { type: String, enum: ['Básico', 'Intermedio', 'Avanzado'], required: true },
    createdByTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

export const Module = mongoose.model('Module', moduleSchema);
