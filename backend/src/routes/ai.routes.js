import { Router } from 'express';
import { authJWT } from '../middleware/authJWT.js';
import { chat, getHistoryById, listHistory } from '../controllers/ai.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.post('/chat', authJWT, asyncHandler(chat));
router.get('/history', authJWT, asyncHandler(listHistory));
router.get('/history/:id', authJWT, asyncHandler(getHistoryById));

export default router;
