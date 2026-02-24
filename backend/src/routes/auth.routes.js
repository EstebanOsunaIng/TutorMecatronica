import { Router } from 'express';
import {
  login,
  register,
  changePassword,
  requestPasswordChangeConfirmation,
  confirmPasswordChangeRequest,
  getPasswordChangeStatus,
  completePasswordChange
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authJWT } from '../middleware/authJWT.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { changePasswordRequestLimiter, loginLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/login', loginLimiter, validate(['email', 'password']), asyncHandler(login));
router.post('/register', validate(['role', 'name', 'lastName', 'document', 'email', 'password']), asyncHandler(register));
router.post('/change-password', authJWT, validate(['currentPassword', 'newPassword']), asyncHandler(changePassword));
router.post('/change-password/request-confirmation', authJWT, changePasswordRequestLimiter, validate(['email']), asyncHandler(requestPasswordChangeConfirmation));
router.get('/change-password/confirm', asyncHandler(confirmPasswordChangeRequest));
router.get('/change-password/status/:requestId', authJWT, asyncHandler(getPasswordChangeStatus));
router.post('/change-password/complete', authJWT, validate(['requestId', 'newPassword', 'confirmPassword']), asyncHandler(completePasswordChange));

export default router;
