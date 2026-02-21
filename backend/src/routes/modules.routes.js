import { Router } from 'express';
import { authJWT } from '../middleware/authJWT.js';
import { requireRole } from '../middleware/requireRole.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  listModules,
  listPublishedModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
  importModuleFromPdf,
  addLessonLevel,
  updateLessonLevel,
  deleteLessonLevel
} from '../controllers/modules.controller.js';

import multer from 'multer';

const UPLOAD_TMP_DIR = path.join(os.tmpdir(), 'tutormecatronica-uploads');
fs.mkdirSync(UPLOAD_TMP_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_TMP_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.pdf';
    const safeExt = ext === '.pdf' ? ext : '.pdf';
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    return cb(Object.assign(new Error('Solo se permiten archivos PDF'), { status: 400, code: 'INVALID_FILE_TYPE' }));
  }
});

const router = Router();

router.get('/', authJWT, asyncHandler(listModules));
router.get('/published', authJWT, asyncHandler(listPublishedModules));
router.get('/:id', authJWT, asyncHandler(getModule));

router.post('/', authJWT, requireRole(['TEACHER', 'ADMIN']), asyncHandler(createModule));
router.post('/import/pdf', authJWT, requireRole(['TEACHER', 'ADMIN']), upload.single('file'), asyncHandler(importModuleFromPdf));
router.put('/:id', authJWT, requireRole(['TEACHER', 'ADMIN']), asyncHandler(updateModule));
router.delete('/:id', authJWT, requireRole(['TEACHER', 'ADMIN']), asyncHandler(deleteModule));

router.post('/:moduleId/levels', authJWT, requireRole(['TEACHER', 'ADMIN']), asyncHandler(addLessonLevel));
router.put('/:moduleId/levels/:levelId', authJWT, requireRole(['TEACHER', 'ADMIN']), asyncHandler(updateLessonLevel));
router.delete('/:moduleId/levels/:levelId', authJWT, requireRole(['TEACHER', 'ADMIN']), asyncHandler(deleteLessonLevel));

export default router;
