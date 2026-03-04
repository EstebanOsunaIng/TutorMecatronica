import mongoose from 'mongoose';
import { Module } from '../models/Module.model.js';
import { LessonLevel } from '../models/LessonLevel.model.js';

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

function toObjectId(id) {
  if (!id) return null;
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}

function safeJoinLines(lines) {
  return lines
    .map((l) => normalizeText(l))
    .filter(Boolean)
    .join('\n');
}

function formatLevelBlock(level) {
  const resources = Array.isArray(level?.resources) ? level.resources.map((r) => String(r || '').trim()).filter(Boolean) : [];
  const imageContexts = Array.isArray(level?.imageItems)
    ? level.imageItems.map((it) => String(it?.context || '').trim()).filter(Boolean)
    : [];

  const header = `- Nivel ${level.order}: ${level.title}`;
  const bodyLines = [];
  if (level.levelTitle) bodyLines.push(`  Tema: ${level.levelTitle}`);
  if (level.contentText) bodyLines.push(`  Contenido: ${level.contentText}`);
  if (level.contextForAI) bodyLines.push(`  Contexto: ${level.contextForAI}`);
  if (resources.length) bodyLines.push(`  Recursos: ${resources.join(' | ')}`);
  if (imageContexts.length) bodyLines.push(`  Imagenes (contexto): ${imageContexts.join(' | ')}`);

  return safeJoinLines([header, ...bodyLines]);
}

function buildModuleContext({ moduleItem, levels, focusLevelId, maxChars }) {
  const focusId = String(focusLevelId || '');
  const sorted = Array.isArray(levels) ? levels : [];

  const focusLevel = focusId ? sorted.find((l) => String(l?._id) === focusId) : null;
  const rest = focusLevel ? sorted.filter((l) => String(l?._id) !== String(focusLevel._id)) : sorted;

  const blocks = [];
  blocks.push(safeJoinLines([
    `Modulo: ${moduleItem?.title || ''}`,
    moduleItem?.description ? `Descripcion: ${moduleItem.description}` : ''
  ]));

  if (focusLevel) {
    blocks.push('Nivel actual (prioridad):');
    blocks.push(formatLevelBlock(focusLevel));
  }

  if (rest.length) {
    blocks.push('Otros niveles del modulo:');
    for (const lvl of rest) {
      blocks.push(formatLevelBlock(lvl));
    }
  }

  const merged = blocks.filter(Boolean).join('\n\n');
  if (!maxChars || merged.length <= maxChars) return merged;

  // Truncate conservatively; keep the beginning which contains module + focus.
  return `${merged.slice(0, Math.max(0, maxChars - 20)).trim()}\n\n[...recortado]`;
}

function buildKeywordRegex(query) {
  const raw = normalizeText(query || '').toLowerCase();
  if (!raw) return null;
  const words = raw
    .split(/[^a-z0-9áéíóúñ]+/i)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4)
    .slice(0, 10);
  const unique = Array.from(new Set(words));
  if (!unique.length) return null;
  const escaped = unique.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(escaped.join('|'), 'i');
}

function truncateInline(text, maxLen) {
  const t = normalizeText(text);
  if (!maxLen || t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(0, maxLen - 12)).trim()}... [recortado]`;
}

export async function retrieveModuleContext({ user, query = '', moduleId, levelId, maxChars = 9000 }) {
  const moduleObjectId = toObjectId(moduleId);
  if (!moduleObjectId) return '';

  const role = String(user?.role || '').toUpperCase();
  const userId = toObjectId(user?.id);

  const filter = { _id: moduleObjectId };
  if (role === 'STUDENT') {
    filter.isPublished = true;
  } else if (role === 'TEACHER') {
    if (userId) filter.createdByTeacherId = userId;
  }

  const moduleItem = await Module.findOne(filter).select('title description isPublished createdByTeacherId');
  if (!moduleItem) return '';

  const levelsAll = await LessonLevel.find({ moduleId: moduleItem._id })
    .sort({ order: 1 })
    .select('order title levelTitle contentText resources imageItems contextForAI');

  const focusId = String(levelId || '');
  const focusLevel = focusId ? levelsAll.find((l) => String(l?._id) === focusId) : null;
  const keywordRe = buildKeywordRegex(query);

  const matched = keywordRe
    ? levelsAll
      .filter((l) => {
        if (focusLevel && String(l?._id) === String(focusLevel._id)) return false;
        const hay = `${l?.title || ''}\n${l?.levelTitle || ''}\n${l?.contentText || ''}\n${l?.contextForAI || ''}`;
        return keywordRe.test(hay);
      })
      .slice(0, 3)
    : [];

  const compactLevels = levelsAll.map((l) => ({ order: l.order, title: l.title, _id: l._id }));

  const lines = [];
  lines.push(`Modulo: ${moduleItem.title}`);
  if (moduleItem.description) lines.push(`Descripcion: ${truncateInline(moduleItem.description, 300)}`);

  if (focusLevel) {
    lines.push('Nivel actual (detallado):');
    lines.push(formatLevelBlock({
      ...focusLevel.toObject(),
      contentText: truncateInline(focusLevel.contentText || '', 1200),
      contextForAI: truncateInline(focusLevel.contextForAI || '', 600)
    }));
  }

  if (matched.length) {
    lines.push('Otros niveles relevantes (detallado):');
    for (const lvl of matched) {
      lines.push(formatLevelBlock({
        ...lvl.toObject(),
        contentText: truncateInline(lvl.contentText || '', 700),
        contextForAI: truncateInline(lvl.contextForAI || '', 400)
      }));
    }
  }

  if (compactLevels.length) {
    lines.push('Indice de niveles del modulo:');
    lines.push(compactLevels.map((l) => `- ${l.order}. ${l.title}`).join('\n'));
  }

  const merged = safeJoinLines(lines);
  if (!maxChars || merged.length <= maxChars) return merged;
  return `${merged.slice(0, Math.max(0, maxChars - 20)).trim()}\n\n[...recortado]`;
}
