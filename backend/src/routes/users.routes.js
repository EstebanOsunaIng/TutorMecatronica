import { Router } from 'express';
import { authJWT } from '../middleware/authJWT.js';
import { requireRole } from '../middleware/requireRole.js';
import { createUserByAdmin, listUsers, updateUser, deleteUser, getMe, updateMe } from '../controllers/users.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get('/me', authJWT, asyncHandler(getMe));
router.put('/me', authJWT, asyncHandler(updateMe));

router.get('/', authJWT, requireRole(['ADMIN']), asyncHandler(listUsers));
router.post('/', authJWT, requireRole(['ADMIN']), asyncHandler(createUserByAdmin));
router.put('/:id', authJWT, requireRole(['ADMIN']), asyncHandler(updateUser));
router.delete('/:id', authJWT, requireRole(['ADMIN']), asyncHandler(deleteUser));

export default router;
