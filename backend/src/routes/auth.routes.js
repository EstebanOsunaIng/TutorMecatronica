import { Router } from 'express';
import { login, register, forgotPassword, resetPassword, changePassword } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authJWT } from '../middleware/authJWT.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.post('/login', validate(['email', 'password']), asyncHandler(login));
router.post('/register', validate(['role', 'name', 'lastName', 'document', 'email', 'password']), asyncHandler(register));
router.post('/forgot', validate(['email']), asyncHandler(forgotPassword));
router.post('/reset', validate(['email', 'code', 'newPassword']), asyncHandler(resetPassword));
router.post('/change-password', authJWT, validate(['currentPassword', 'newPassword']), asyncHandler(changePassword));

export default router;
