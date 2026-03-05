import { Router } from 'express';
import { authJWT } from '../middleware/authJWT.js';
import { requireRole } from '../middleware/requireRole.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  listNotifications,
  markNotificationRead,
  deleteNotification,
  markAllRead,
  deleteManyNotifications
} from '../controllers/notifications.controller.js';

const router = Router();

router.get('/', authJWT, asyncHandler(listNotifications));
router.patch('/marcar-todas', authJWT, asyncHandler(markAllRead));
router.patch('/leidas', authJWT, asyncHandler(markAllRead));
router.patch('/:id/leida', authJWT, asyncHandler(markNotificationRead));
router.delete('/lote', authJWT, asyncHandler(deleteManyNotifications));
router.delete('/:id', authJWT, requireRole(['ADMIN']), asyncHandler(deleteNotification));

export default router;
