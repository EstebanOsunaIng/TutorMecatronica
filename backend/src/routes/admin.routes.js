import { Router } from 'express';
import { authJWT } from '../middleware/authJWT.js';
import { requireRole } from '../middleware/requireRole.js';
import { createTeacherCode, listTeacherCodes } from '../controllers/admin.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.post('/teacher-codes', authJWT, requireRole(['ADMIN']), asyncHandler(createTeacherCode));
router.get('/teacher-codes', authJWT, requireRole(['ADMIN']), asyncHandler(listTeacherCodes));

export default router;
