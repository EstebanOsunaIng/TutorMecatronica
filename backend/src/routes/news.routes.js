import { Router } from 'express';
import { authJWT } from '../middleware/authJWT.js';
import { requireRole } from '../middleware/requireRole.js';
import { listNews, refreshNews } from '../controllers/news.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get('/', authJWT, asyncHandler(listNews));
router.post('/refresh', authJWT, requireRole(['TEACHER', 'ADMIN']), asyncHandler(refreshNews));

export default router;
