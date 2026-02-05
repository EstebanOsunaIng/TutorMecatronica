import { Router } from 'express';
import { authJWT } from '../middleware/authJWT.js';
import { chat } from '../controllers/ai.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.post('/chat', authJWT, asyncHandler(chat));

export default router;
