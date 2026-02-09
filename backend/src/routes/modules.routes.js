import { Router } from 'express';
import { authJWT } from '../middleware/authJWT.js';
import { requireRole } from '../middleware/requireRole.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
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

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

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
