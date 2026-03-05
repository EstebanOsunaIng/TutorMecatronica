import { Router } from 'express';
import { authJWT } from '../middleware/authJWT.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { pingPresence } from '../controllers/presence.controller.js';

const router = Router();

router.post('/ping', authJWT, asyncHandler(pingPresence));

export default router;
