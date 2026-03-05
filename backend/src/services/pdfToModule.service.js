import fs from 'node:fs/promises';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

function normalizeText(s) {
  return String(s || '')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ +/g, ' ')
    .trim();
}

function guessModuleLevel(text) {
  const t = text.toLowerCase();
  if (t.includes('avanzado')) return 'Avanzado';
  if (t.includes('intermedio')) return 'Intermedio';
  return 'Básico';
}

function splitLessons(text) {
  const lines = text.split('\n');
  const marker = (line) =>
    /^\s*(nivel|lecci[oó]n|tema)\s*\d+\s*[:\-]/i.test(line) ||
    /^\s*(nivel|lecci[oó]n|tema)\s*\d+\s+.+/i.test(line);

  const sections = [];
  let current = null;

  for (const line of lines) {
    if (marker(line)) {
      if (current) sections.push(current);
      current = { title: line.trim(), body: [] };
      continue;
    }
    if (!current) current = { title: 'Nivel 1: Introduccion', body: [] };
    current.body.push(line);
  }
  if (current) sections.push(current);

  const lessons = sections
    .map((s, idx) => ({
      order: idx + 1,
      title: s.title || `Nivel ${idx + 1}`,
      contentText: normalizeText(s.body.join('\n')),
      videoUrl: '',
      resources: [],
      activity: { type: 'exercise', questions: [], passingScore: 0 },
      contextForAI: ''
    }))
    .filter((l) => l.contentText || l.title);

  if (lessons.length === 0) {
    return [
      {
        order: 1,
        title: 'Nivel 1: Contenido del PDF',
        contentText: text,
        videoUrl: '',
        resources: [],
        activity: { type: 'exercise', questions: [], passingScore: 0 },
        contextForAI: ''
      }
    ];
  }

  return lessons;
}

export async function parsePdfToModule(filePath) {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);
  const raw = normalizeText(data.text || '');

  const firstLine = raw.split('\n').find((l) => l.trim()) || '';
  const title = firstLine.length >= 6 ? firstLine.slice(0, 120) : 'Modulo importado desde PDF';
  const description = 'Contenido importado automaticamente desde un PDF. Revisa y ajusta niveles y actividades.';
  const level = guessModuleLevel(raw);
  const lessons = splitLessons(raw);

  return { title, description, level, lessons };
}
