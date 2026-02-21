import { Router } from 'express';
import multer from 'multer';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { authJWT } from '../middleware/authJWT.js';
import { requireRole } from '../middleware/requireRole.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { listKnowledge, uploadKnowledge, removeKnowledge } from '../controllers/knowledge.controller.js';

const router = Router();

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

router.get('/', authJWT, requireRole(['TEACHER', 'ADMIN']), asyncHandler(listKnowledge));
router.post('/upload', authJWT, requireRole(['TEACHER', 'ADMIN']), upload.single('file'), asyncHandler(uploadKnowledge));
router.delete('/:id', authJWT, requireRole(['TEACHER', 'ADMIN']), asyncHandler(removeKnowledge));

export default router;
