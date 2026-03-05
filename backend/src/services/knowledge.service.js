import { createRequire } from 'module';
import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import { env } from '../config/env.js';
import { KnowledgeChunk } from '../models/KnowledgeChunk.model.js';
import { KnowledgeDocument } from '../models/KnowledgeDocument.model.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 120;
const MAX_CHUNKS_PER_DOCUMENT = 1500;

function normalizeText(s = '') {
  return String(s)
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ +/g, ' ')
    .trim();
}

function detectLanguage(text) {
  const t = String(text || '').toLowerCase();
  const hasEs = /( de | la | el | los | las | para | con | nivel | modulo | estudiante )/.test(` ${t} `) || /[áéíóúñ¿¡]/.test(t);
  const hasEn = /( the | and | for | with | level | module | student | guide )/.test(` ${t} `);
  if (hasEs && hasEn) return 'mixed';
  if (hasEs) return 'es';
  if (hasEn) return 'en';
  return 'unknown';
}

function splitIntoChunks(text) {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const chunks = [];
  let start = 0;
  while (start < normalized.length && chunks.length < MAX_CHUNKS_PER_DOCUMENT) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);
    const raw = normalized.slice(start, end);
    const chunk = raw.trim();
    if (chunk) chunks.push(chunk);
    if (end >= normalized.length) break;
    start = Math.max(0, end - CHUNK_OVERLAP);
  }
  return chunks;
}

async function createEmbeddings(inputs) {
  const apiKey = env.ai.openaiApiKey;
  if (!apiKey) throw Object.assign(new Error('OPENAI_API_KEY missing for embeddings'), { status: 400 });

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.ai.openaiEmbeddingModel,
      input: inputs
    })
  });

  if (!res.ok) {
    const details = await res.text().catch(() => '');
    throw Object.assign(new Error('Embedding provider error'), { status: 502, details });
  }

  const data = await res.json();
  const vectors = Array.isArray(data?.data) ? data.data.map((i) => i.embedding) : [];
  return vectors;
}

function toObjectId(id) {
  if (!id) return undefined;
  if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
  return new mongoose.Types.ObjectId(id);
}

async function safeRemoveFile(filePath) {
  if (!filePath) return;
  try {
    await fs.rm(filePath, { force: true });
  } catch {
    // ignore
  }
}

export async function processKnowledgeDocumentPdf({
  documentId,
  filePath,
  buffer,
  title,
  fileName,
  uploadedByUserId,
  moduleId,
  levelId
}) {
  const moduleObjectId = toObjectId(moduleId);
  const levelObjectId = toObjectId(levelId);

  const doc = await KnowledgeDocument.findById(documentId);
  if (!doc) {
    await safeRemoveFile(filePath);
    return { doc: null, chunksCreated: 0 };
  }

  doc.title = title || doc.title;
  doc.fileName = fileName || doc.fileName || '';
  doc.sourceType = moduleObjectId ? 'module_pdf' : 'extra_pdf';
  doc.moduleId = moduleObjectId;
  doc.levelId = levelObjectId;
  doc.uploadedByUserId = uploadedByUserId;
  doc.status = 'processing';
  doc.errorMessage = '';
  doc.chunksCount = 0;
  doc.progressPercent = 0;
  doc.chunksProcessed = 0;
  doc.chunksTotal = 0;
  await doc.save();

  try {
    const pdfBuffer = buffer || (filePath ? await fs.readFile(filePath) : Buffer.from([]));
    const parsed = await pdfParse(pdfBuffer);
    const text = normalizeText(parsed?.text || '');
    const language = detectLanguage(text);
    const chunks = splitIntoChunks(text);

    await KnowledgeChunk.deleteMany({ documentId: doc._id });

    doc.chunksTotal = chunks.length;
    doc.chunksProcessed = 0;
    doc.progressPercent = chunks.length ? 1 : 0;
    await doc.save();

    if (chunks.length === 0) {
      doc.status = 'error';
      doc.errorMessage = 'No se pudo extraer texto util del PDF';
      await doc.save();
      return { doc, chunksCreated: 0 };
    }

    const batchSize = 40;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const vectors = await createEmbeddings(batch);

      const rows = [];
      for (let j = 0; j < batch.length; j += 1) {
        rows.push({
          documentId: doc._id,
          moduleId: moduleObjectId,
          levelId: levelObjectId,
          text: batch[j],
          embedding: vectors[j] || [],
          tokenCount: Math.ceil(batch[j].length / 4),
          metadata: { page: 0, section: '', language }
        });
      }

      await KnowledgeChunk.insertMany(rows);

      doc.chunksProcessed = Math.min(chunks.length, i + batch.length);
      doc.progressPercent = chunks.length ? Math.min(99, Math.floor((doc.chunksProcessed / chunks.length) * 100)) : 0;
      doc.chunksCount = doc.chunksProcessed;
      await doc.save();
    }

    doc.language = language;
    doc.status = 'ready';
    doc.chunksCount = chunks.length;
    doc.chunksProcessed = chunks.length;
    doc.chunksTotal = chunks.length;
    doc.progressPercent = 100;
    doc.errorMessage = '';
    await doc.save();
    return { doc, chunksCreated: chunks.length };
  } catch (err) {
    doc.status = 'error';
    doc.errorMessage = err?.message || 'Error procesando PDF';
    doc.progressPercent = Math.min(99, Number(doc.progressPercent) || 0);
    await doc.save();
    return { doc, chunksCreated: 0 };
  } finally {
    await safeRemoveFile(filePath);
  }
}

function cosineSimilarity(a = [], b = []) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0 || a.length !== b.length) return -1;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = Number(a[i]) || 0;
    const y = Number(b[i]) || 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (!normA || !normB) return -1;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embeddingForQuery(query) {
  const vectors = await createEmbeddings([query]);
  return vectors[0] || [];
}

function rankChunks(queryEmbedding, chunks, topK) {
  const ranked = chunks
    .map((c) => ({ chunk: c, score: cosineSimilarity(queryEmbedding, c.embedding || []) }))
    .filter((r) => Number.isFinite(r.score) && r.score >= 0.22)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  return ranked;
}

export async function retrieveKnowledgeContext({ query, moduleId, levelId }) {
  const text = normalizeText(query || '');
  if (!text) return { snippets: [], contextText: '' };

  const queryEmbedding = await embeddingForQuery(text);
  const moduleObjectId = toObjectId(moduleId);
  const levelObjectId = toObjectId(levelId);

  const levelChunks = levelObjectId
    ? await KnowledgeChunk.find({ levelId: levelObjectId }).limit(300).select('text embedding moduleId levelId documentId metadata')
    : [];
  const moduleChunks = moduleObjectId
    ? await KnowledgeChunk.find({ moduleId: moduleObjectId }).limit(500).select('text embedding moduleId levelId documentId metadata')
    : [];
  const globalChunks = await KnowledgeChunk.find({ moduleId: { $exists: false } })
    .limit(400)
    .select('text embedding moduleId levelId documentId metadata');

  const topLevel = rankChunks(queryEmbedding, levelChunks, 8);
  const selectedIds = new Set(topLevel.map((r) => String(r.chunk._id)));

  const topModule = rankChunks(
    queryEmbedding,
    moduleChunks.filter((c) => !selectedIds.has(String(c._id))),
    8
  );
  topModule.forEach((r) => selectedIds.add(String(r.chunk._id)));

  const topGlobal = rankChunks(
    queryEmbedding,
    globalChunks.filter((c) => !selectedIds.has(String(c._id))),
    4
  );

  const merged = [...topLevel, ...topModule, ...topGlobal];
  const snippets = merged.map((row, idx) => ({
    rank: idx + 1,
    score: row.score,
    text: row.chunk.text,
    moduleId: row.chunk.moduleId || null,
    levelId: row.chunk.levelId || null,
    documentId: row.chunk.documentId || null
  }));

  const contextText = snippets
    .map((s, idx) => `Fuente ${idx + 1}:\n${s.text}`)
    .join('\n\n');

  return { snippets, contextText };
}

export async function deleteKnowledgeDocument(docId) {
  const doc = await KnowledgeDocument.findByIdAndDelete(docId);
  if (!doc) return null;
  await KnowledgeChunk.deleteMany({ documentId: doc._id });
  return doc;
}
