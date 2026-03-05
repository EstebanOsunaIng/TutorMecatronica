import { Router } from 'express';
import { authJWT } from '../middleware/authJWT.js';
import { requireRole } from '../middleware/requireRole.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { listStudents, getStudentProgress, exportStudentsCsv } from '../controllers/teacher.controller.js';

const router = Router();

router.get('/students', authJWT, requireRole(['TEACHER', 'ADMIN']), asyncHandler(listStudents));
router.get('/students/export', authJWT, requireRole(['TEACHER', 'ADMIN']), asyncHandler(exportStudentsCsv));
router.get('/students/:studentId/progress', authJWT, requireRole(['TEACHER', 'ADMIN']), asyncHandler(getStudentProgress));

export default router;
