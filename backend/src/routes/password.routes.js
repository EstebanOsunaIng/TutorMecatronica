import express from 'express';
import { forgotPassword, resetPassword } from '../controllers/password.controller.js';
import { forgotLimiter, resetLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.post('/forgot-password', forgotLimiter, validate(['email']), asyncHandler(forgotPassword));
router.post(
  '/reset-password',
  resetLimiter,
  validate(['email', 'code', 'newPassword']),
  asyncHandler(resetPassword)
);

export default router;
