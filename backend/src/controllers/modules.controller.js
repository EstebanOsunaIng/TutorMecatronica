import { Module } from '../models/Module.model.js';
import { LessonLevel } from '../models/LessonLevel.model.js';
import { Badge } from '../models/Badge.model.js';
import fs from 'node:fs/promises';
import { parsePdfToModule } from '../services/pdfToModule.service.js';
import { createNotification, createNotificationsForStudents } from '../services/notifications.service.js';
import { assertPdfFile } from '../utils/fileValidation.js';

function canManageModule(moduleItem, reqUser) {
  if (!moduleItem || !reqUser) return false;
  if (reqUser.role === 'ADMIN') return true;
  if (reqUser.role === 'TEACHER') return String(moduleItem.createdByTeacherId || '') === String(reqUser.id || '');
  return false;
}

export async function listModules(req, res) {
  let filter = {};
  if (req.user?.role === 'TEACHER') {
    filter = { createdByTeacherId: req.user.id };
  } else if (req.user?.role === 'STUDENT') {
    filter = { isPublished: true };
  }
  const modules = await Module.find(filter).sort({ createdAt: -1 });
  res.json({ modules });
}

export async function listPublishedModules(_req, res) {
  const modules = await Module.find({ isPublished: true }).sort({ createdAt: -1 });
  res.json({ modules });
}

export async function getModule(req, res) {
  const moduleItem = await Module.findById(req.params.id);
  if (!moduleItem) return res.status(404).json({ error: 'Module not found' });
  if (!canManageModule(moduleItem, req.user) && !moduleItem.isPublished) {
    return res.status(403).json({ error: 'No tienes permisos para ver este modulo' });
  }
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

  await createNotification({
    userId: req.user.id,
    title: 'Modulo creado',
    message: `Has creado el modulo '${moduleItem.title}' correctamente.`,
    type: 'MODULO_CREADO'
  });

  if (moduleItem.isPublished) {
    const publishedBy = req.user?.role === 'ADMIN' ? 'El administrador' : 'El profesor';
    await createNotificationsForStudents({
      title: 'Nuevo modulo publicado',
      message: `${publishedBy} ha publicado el modulo '${moduleItem.title}'.`,
      type: 'MODULO_CREADO'
    });
  }

  res.status(201).json({ module: moduleItem });
}

export async function updateModule(req, res) {
  const prev = await Module.findById(req.params.id);
  if (!prev) return res.status(404).json({ error: 'Module not found' });
  if (!canManageModule(prev, req.user)) return res.status(403).json({ error: 'No tienes permisos para editar este modulo' });
  const moduleItem = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!moduleItem) return res.status(404).json({ error: 'Module not found' });

  if (prev && prev.title !== moduleItem.title) {
    await Badge.findOneAndUpdate(
      { moduleId: moduleItem._id },
      { $set: { name: `Insignia: ${moduleItem.title}`, description: `Completaste el modulo ${moduleItem.title}` } },
      { new: true }
    );
  }

  await createNotification({
    userId: req.user.id,
    title: 'Modulo actualizado',
    message: `El modulo '${moduleItem.title}' fue actualizado correctamente.`,
    type: 'MODULO_EDITADO'
  });

  if (req.user?.role === 'ADMIN') {
    await createNotificationsForStudents({
      title: 'Modulo actualizado',
      message: `El administrador actualizo el modulo '${moduleItem.title}'.`,
      type: 'MODULO_EDITADO'
    });
  }

  if (prev && !prev.isPublished && moduleItem.isPublished) {
    const publishedBy = req.user?.role === 'ADMIN' ? 'El administrador' : 'El profesor';
    await createNotificationsForStudents({
      title: 'Nuevo modulo publicado',
      message: `${publishedBy} ha publicado el modulo '${moduleItem.title}'.`,
      type: 'MODULO_CREADO'
    });
  }
  res.json({ module: moduleItem });
}

export async function deleteModule(req, res) {
  const moduleItem = await Module.findById(req.params.id);
  if (!moduleItem) return res.status(404).json({ error: 'Module not found' });
  if (!canManageModule(moduleItem, req.user)) return res.status(403).json({ error: 'No tienes permisos para eliminar este modulo' });
  await Module.deleteOne({ _id: moduleItem._id });
  await LessonLevel.deleteMany({ moduleId: moduleItem._id });
  await Badge.deleteMany({ moduleId: moduleItem._id });
  await createNotification({
    userId: req.user.id,
    title: 'Modulo eliminado',
    message: `El modulo '${moduleItem.title}' fue eliminado.`,
    type: 'MODULO_ELIMINADO'
  });
  res.json({ ok: true });
}

export async function importModuleFromPdf(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Missing file' });

  const filePath = req.file.path;

  try {
    await assertPdfFile(filePath);
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

    await createNotification({
      userId: req.user.id,
      title: 'Modulo creado',
      message: `Has creado el modulo '${moduleItem.title}' correctamente.`,
      type: 'MODULO_CREADO'
    });

    if (moduleItem.isPublished) {
      const publishedBy = req.user?.role === 'ADMIN' ? 'El administrador' : 'El profesor';
      await createNotificationsForStudents({
        title: 'Nuevo modulo publicado',
        message: `${publishedBy} ha publicado el modulo '${moduleItem.title}'.`,
        type: 'MODULO_CREADO'
      });
    }

    const lessons = Array.isArray(parsed.lessons) ? parsed.lessons : [];
    const created = [];
    for (const l of lessons) {
      created.push(
        await LessonLevel.create({
          moduleId: moduleItem._id,
          order: l.order,
          levelNumber: l.levelNumber || l.order,
          sublevelNumber: l.sublevelNumber || 1,
          levelTitle: l.levelTitle || `Nivel ${l.levelNumber || l.order}`,
          title: l.title,
          contentText: l.contentText || '',
          videoUrl: l.videoUrl || '',
          resources: l.resources || [],
          imageItems: l.imageItems || [],
          activity: l.activity || {},
          contextForAI: l.contextForAI || ''
        })
      );
    }

    res.status(201).json({ module: moduleItem, levels: created });
  } finally {
    await fs.rm(filePath, { force: true });
  }
}

export async function addLessonLevel(req, res) {
  const { moduleId } = req.params;
  const moduleItem = await Module.findById(moduleId);
  if (!moduleItem) return res.status(404).json({ error: 'Module not found' });
  if (!canManageModule(moduleItem, req.user)) return res.status(403).json({ error: 'No tienes permisos para editar niveles en este modulo' });

  const level = await LessonLevel.create({
    moduleId,
    order: req.body.order,
    levelNumber: req.body.levelNumber || req.body.order,
    sublevelNumber: req.body.sublevelNumber || 1,
    levelTitle: req.body.levelTitle || `Nivel ${req.body.levelNumber || req.body.order || 1}`,
    title: req.body.title,
    contentText: req.body.contentText || '',
    videoUrl: req.body.videoUrl || '',
    resources: req.body.resources || [],
    imageItems: req.body.imageItems || [],
    activity: req.body.activity || {},
    contextForAI: req.body.contextForAI || ''
  });
  res.status(201).json({ level });
}

export async function updateLessonLevel(req, res) {
  const levelFound = await LessonLevel.findById(req.params.levelId);
  if (!levelFound) return res.status(404).json({ error: 'Lesson level not found' });
  if (String(levelFound.moduleId) !== String(req.params.moduleId)) {
    return res.status(400).json({ error: 'Level does not belong to module' });
  }

  const moduleItem = await Module.findById(levelFound.moduleId);
  if (!moduleItem) return res.status(404).json({ error: 'Module not found' });
  if (!canManageModule(moduleItem, req.user)) return res.status(403).json({ error: 'No tienes permisos para editar niveles en este modulo' });

  const level = await LessonLevel.findByIdAndUpdate(req.params.levelId, req.body, { new: true });
  if (!level) return res.status(404).json({ error: 'Lesson level not found' });
  res.json({ level });
}

export async function deleteLessonLevel(req, res) {
  const level = await LessonLevel.findById(req.params.levelId);
  if (!level) return res.status(404).json({ error: 'Lesson level not found' });
  if (String(level.moduleId) !== String(req.params.moduleId)) {
    return res.status(400).json({ error: 'Level does not belong to module' });
  }
  const moduleItem = await Module.findById(level.moduleId);
  if (!moduleItem) return res.status(404).json({ error: 'Module not found' });
  if (!canManageModule(moduleItem, req.user)) return res.status(403).json({ error: 'No tienes permisos para eliminar niveles en este modulo' });

  await LessonLevel.deleteOne({ _id: level._id });
  res.json({ ok: true });
}
