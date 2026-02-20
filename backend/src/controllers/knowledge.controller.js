import mongoose from 'mongoose';
import { KnowledgeDocument } from '../models/KnowledgeDocument.model.js';
import { processKnowledgeDocumentPdf, deleteKnowledgeDocument } from '../services/knowledge.service.js';

export async function listKnowledge(req, res) {
  const q = String(req.query.q || '').trim();
  const moduleId = String(req.query.moduleId || '').trim();
  const status = String(req.query.status || '').trim();

  const filter = {};
  if (q) filter.title = new RegExp(q, 'i');
  if (moduleId) filter.moduleId = moduleId;
  if (status) filter.status = status;

  const docs = await KnowledgeDocument.find(filter)
    .sort({ updatedAt: -1 })
    .limit(300)
    .populate('moduleId', 'title')
    .populate('levelId', 'title order')
    .populate('uploadedByUserId', 'name lastName email');

  res.json({ documents: docs });
}

export async function uploadKnowledge(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Missing file' });

  const title = String(req.body.title || req.file.originalname || 'Documento').trim();
  const rawModuleId = req.body.moduleId || undefined;
  const rawLevelId = req.body.levelId || undefined;
  const moduleId = rawModuleId && mongoose.Types.ObjectId.isValid(rawModuleId) ? rawModuleId : undefined;
  const levelId = rawLevelId && mongoose.Types.ObjectId.isValid(rawLevelId) ? rawLevelId : undefined;

  const doc = await KnowledgeDocument.create({
    title,
    fileName: req.file.originalname || '',
    sourceType: moduleId ? 'module_pdf' : 'extra_pdf',
    moduleId: moduleId || undefined,
    levelId: levelId || undefined,
    uploadedByUserId: req.user.id,
    status: 'processing',
    chunksCount: 0,
    progressPercent: 0,
    chunksProcessed: 0,
    chunksTotal: 0,
    errorMessage: ''
  });

  res.status(202).json({ document: doc, message: 'Procesando documento' });

  const filePath = req.file.path;
  setImmediate(() => {
    processKnowledgeDocumentPdf({
      documentId: doc._id,
      filePath,
      title,
      fileName: req.file.originalname || '',
      uploadedByUserId: req.user.id,
      moduleId,
      levelId
    }).catch((err) => {
      console.error('[knowledge] background ingest failed', err);
    });
  });
}

export async function removeKnowledge(req, res) {
  const doc = await deleteKnowledgeDocument(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json({ ok: true });
}
