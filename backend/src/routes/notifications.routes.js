import { Router } from 'express';
import { authJWT } from '../middleware/authJWT.js';
import { requireRole } from '../middleware/requireRole.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  listNotifications,
  markNotificationRead,
  deleteNotification,
  markAllRead
} from '../controllers/notifications.controller.js';

const router = Router();

router.get('/', authJWT, asyncHandler(listNotifications));
router.patch('/leidas', authJWT, asyncHandler(markAllRead));
router.patch('/:id/leida', authJWT, asyncHandler(markNotificationRead));
router.delete('/:id', authJWT, requireRole(['ADMIN']), asyncHandler(deleteNotification));

export default router;
