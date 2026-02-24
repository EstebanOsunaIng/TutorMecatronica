import { Router } from 'express';
import multer from 'multer';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { authJWT } from '../middleware/authJWT.js';
import { chat, getHistoryById, listHistory, deleteHistory } from '../controllers/ai.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

const UPLOAD_TMP_DIR = path.join(os.tmpdir(), 'tutormecatronica-uploads');
fs.mkdirSync(UPLOAD_TMP_DIR, { recursive: true });

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_TMP_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`);
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return cb(null, true);
    return cb(Object.assign(new Error('Solo se permiten imagenes JPG, PNG o WEBP'), { status: 400, code: 'INVALID_IMAGE_TYPE' }));
  }
});

router.post('/chat', authJWT, imageUpload.array('images', 4), asyncHandler(chat));
router.get('/history', authJWT, asyncHandler(listHistory));
router.get('/history/:id', authJWT, asyncHandler(getHistoryById));
router.delete('/history/:id', authJWT, asyncHandler(deleteHistory));

export default router;
