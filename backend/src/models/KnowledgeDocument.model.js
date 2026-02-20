import mongoose from 'mongoose';

const knowledgeDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    fileName: { type: String, default: '' },
    sourceType: { type: String, enum: ['module_pdf', 'extra_pdf'], default: 'extra_pdf' },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    levelId: { type: mongoose.Schema.Types.ObjectId, ref: 'LessonLevel' },
    uploadedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    language: { type: String, enum: ['es', 'en', 'mixed', 'unknown'], default: 'unknown' },
    status: { type: String, enum: ['processing', 'ready', 'error'], default: 'processing' },
    chunksCount: { type: Number, default: 0 },
    progressPercent: { type: Number, default: 0 },
    chunksProcessed: { type: Number, default: 0 },
    chunksTotal: { type: Number, default: 0 },
    errorMessage: { type: String, default: '' }
  },
  { timestamps: true, versionKey: false }
);

knowledgeDocumentSchema.index({ moduleId: 1, createdAt: -1 });
knowledgeDocumentSchema.index({ uploadedByUserId: 1, createdAt: -1 });

export const KnowledgeDocument = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
