import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { debugMail } from '../controllers/debug.controller.js';

const router = Router();

router.get('/mail', asyncHandler(debugMail));

export default router;
