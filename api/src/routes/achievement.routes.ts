/**
 * 成就路由
 */

import { Router } from 'express';
import {
  getAchievements,
  getUnlockedAchievements,
  getAchievementProgress,
  checkAchievements,
} from '../controllers/achievement.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// 所有路由都需要認證
router.use(authenticate);

// 成就查詢路由
router.get('/', getAchievements);
router.get('/unlocked', getUnlockedAchievements);
router.get('/progress', getAchievementProgress);
router.post('/check', checkAchievements);

export default router;
