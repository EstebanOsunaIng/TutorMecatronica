import { Router } from 'express';
import { authJWT } from '../middleware/authJWT.js';
import { completeLevel, getMyProgress } from '../controllers/progress.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get('/me', authJWT, asyncHandler(getMyProgress));
router.post('/complete-level', authJWT, asyncHandler(completeLevel));

export default router;
