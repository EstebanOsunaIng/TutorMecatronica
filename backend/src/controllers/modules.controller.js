import { Module } from '../models/Module.model.js';
import { LessonLevel } from '../models/LessonLevel.model.js';
import { Badge } from '../models/Badge.model.js';

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
  const { title, description, level, isPublished } = req.body;
  const moduleItem = await Module.create({
    title,
    description,
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
  const moduleItem = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!moduleItem) return res.status(404).json({ error: 'Module not found' });
  res.json({ module: moduleItem });
}

export async function deleteModule(req, res) {
  const moduleItem = await Module.findByIdAndDelete(req.params.id);
  if (!moduleItem) return res.status(404).json({ error: 'Module not found' });
  await LessonLevel.deleteMany({ moduleId: moduleItem._id });
  res.json({ ok: true });
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
