import { Router } from 'express';
import {
  login,
  register,
  changePassword,
  requestPasswordChangeConfirmation,
  confirmPasswordChangeRequest,
  getPasswordChangeStatus,
  completePasswordChange,
  verifyRegistrationEmail,
  requestRegisterEmailVerification,
  getRegisterEmailVerificationStatus,
  verifyRegisterEmailCode
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authJWT } from '../middleware/authJWT.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { changePasswordRequestLimiter, emailVerifyRequestIpLimiter, loginLimiter, registerLimiter, verifyCodeLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/login', loginLimiter, validate(['email', 'password']), asyncHandler(login));
router.post('/register', registerLimiter, validate(['role', 'name', 'lastName', 'document', 'email', 'password']), asyncHandler(register));
router.get('/verify-email', asyncHandler(verifyRegistrationEmail));
router.post('/email/verify-request', emailVerifyRequestIpLimiter, validate(['email']), asyncHandler(requestRegisterEmailVerification));
router.post('/send-verification', emailVerifyRequestIpLimiter, validate(['email']), asyncHandler(requestRegisterEmailVerification));
router.get('/email/verify-status', asyncHandler(getRegisterEmailVerificationStatus));
router.post('/verify-code', verifyCodeLimiter, validate(['email', 'otp']), asyncHandler(verifyRegisterEmailCode));
router.post('/change-password', authJWT, validate(['currentPassword', 'newPassword']), asyncHandler(changePassword));
router.post('/change-password/request-confirmation', authJWT, changePasswordRequestLimiter, validate(['email']), asyncHandler(requestPasswordChangeConfirmation));
router.get('/change-password/confirm', asyncHandler(confirmPasswordChangeRequest));
router.get('/change-password/status/:requestId', authJWT, asyncHandler(getPasswordChangeStatus));
router.post('/change-password/complete', authJWT, validate(['requestId', 'newPassword', 'confirmPassword']), asyncHandler(completePasswordChange));

export default router;
