import { Module } from '../models/Module.model.js';
import { LessonLevel } from '../models/LessonLevel.model.js';
import { Badge } from '../models/Badge.model.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { parsePdfToModule } from '../services/pdfToModule.service.js';

export async function listModules(req, res) {
  const modules = await Module.find().sort({ createdAt: -1 });
  res.json({ modules });
}

export async function listPublishedModules(_req, res) {
  const modules = await Module.find({ isPublished: true }).sort({ createdAt: -1 });
  res.json({ modules });
}

export async function getModule(req, res) {
  const moduleItem = await Module.findById(req.params.id);
  if (!moduleItem) return res.status(404).json({ error: 'Module not found' });
  const levels = await LessonLevel.find({ moduleId: moduleItem._id }).sort({ order: 1 });
  res.json({ module: moduleItem, levels });
}

export async function createModule(req, res) {
  const { title, description, category, imageUrl, level, isPublished } = req.body;
  const moduleItem = await Module.create({
    title,
    description,
    category: category || 'General',
    imageUrl: imageUrl || '',
    level,
    isPublished: isPublished !== undefined ? isPublished : true,
    createdByTeacherId: req.user.id
  });

  await Badge.create({
    moduleId: moduleItem._id,
    name: `Insignia: ${moduleItem.title}`,
    description: `Completaste el modulo ${moduleItem.title}`
  });

  res.status(201).json({ module: moduleItem });
}

export async function updateModule(req, res) {
  const prev = await Module.findById(req.params.id);
  const moduleItem = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!moduleItem) return res.status(404).json({ error: 'Module not found' });

  if (prev && prev.title !== moduleItem.title) {
    await Badge.findOneAndUpdate(
      { moduleId: moduleItem._id },
      { $set: { name: `Insignia: ${moduleItem.title}`, description: `Completaste el modulo ${moduleItem.title}` } },
      { new: true }
    );
  }
  res.json({ module: moduleItem });
}

export async function deleteModule(req, res) {
  const moduleItem = await Module.findByIdAndDelete(req.params.id);
  if (!moduleItem) return res.status(404).json({ error: 'Module not found' });
  await LessonLevel.deleteMany({ moduleId: moduleItem._id });
  await Badge.deleteMany({ moduleId: moduleItem._id });
  res.json({ ok: true });
}

export async function importModuleFromPdf(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Missing file' });

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tutormecatronica-'));
  const filePath = path.join(tmpDir, req.file.originalname || 'module.pdf');
  await fs.writeFile(filePath, req.file.buffer);

  try {
    const parsed = await parsePdfToModule(filePath);
    const moduleItem = await Module.create({
      title: parsed.title,
      description: parsed.description,
      category: 'General',
      imageUrl: '',
      level: parsed.level,
      isPublished: false,
      createdByTeacherId: req.user.id
    });

    await Badge.create({
      moduleId: moduleItem._id,
      name: `Insignia: ${moduleItem.title}`,
      description: `Completaste el modulo ${moduleItem.title}`
    });

    const lessons = Array.isArray(parsed.lessons) ? parsed.lessons : [];
    const created = [];
    for (const l of lessons) {
      created.push(
        await LessonLevel.create({
          moduleId: moduleItem._id,
          order: l.order,
          title: l.title,
          contentText: l.contentText || '',
          videoUrl: l.videoUrl || '',
          resources: l.resources || [],
          activity: l.activity || {},
          contextForAI: l.contextForAI || ''
        })
      );
    }

    res.status(201).json({ module: moduleItem, levels: created });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

export async function addLessonLevel(req, res) {
  const { moduleId } = req.params;
  const level = await LessonLevel.create({
    moduleId,
    order: req.body.order,
    title: req.body.title,
    contentText: req.body.contentText || '',
    videoUrl: req.body.videoUrl || '',
    resources: req.body.resources || [],
    activity: req.body.activity || {},
    contextForAI: req.body.contextForAI || ''
  });
  res.status(201).json({ level });
}

export async function updateLessonLevel(req, res) {
  const level = await LessonLevel.findByIdAndUpdate(req.params.levelId, req.body, { new: true });
  if (!level) return res.status(404).json({ error: 'Lesson level not found' });
  res.json({ level });
}

export async function deleteLessonLevel(req, res) {
  const level = await LessonLevel.findByIdAndDelete(req.params.levelId);
  if (!level) return res.status(404).json({ error: 'Lesson level not found' });
  res.json({ ok: true });
}
