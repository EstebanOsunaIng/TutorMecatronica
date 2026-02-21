import mongoose from 'mongoose';

const knowledgeChunkSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeDocument', required: true, index: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', index: true },
    levelId: { type: mongoose.Schema.Types.ObjectId, ref: 'LessonLevel', index: true },
    text: { type: String, required: true },
    embedding: { type: [Number], default: [] },
    tokenCount: { type: Number, default: 0 },
    metadata: {
      page: { type: Number, default: 0 },
      section: { type: String, default: '' },
      language: { type: String, default: 'unknown' }
    }
  },
  { timestamps: true, versionKey: false }
);

knowledgeChunkSchema.index({ moduleId: 1, levelId: 1 });

export const KnowledgeChunk = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
