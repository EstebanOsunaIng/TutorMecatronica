import { Router } from 'express';
import { authJWT } from '../middleware/authJWT.js';
import { listBadges, rankingTop5, rankingMe } from '../controllers/gamification.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get('/badges', authJWT, asyncHandler(listBadges));
router.get('/ranking/top5', authJWT, asyncHandler(rankingTop5));
router.get('/ranking/me', authJWT, asyncHandler(rankingMe));

export default router;
