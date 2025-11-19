/**
 * 成就控制器
 * 處理成就相關 HTTP 請求
 */

import { Request, Response } from 'express';
import { AchievementService } from '../services/achievement.service';
import { successResponse, errorResponse } from '../utils/response';

/**
 * 取得所有成就及進度
 * GET /api/achievements
 */
export const getAchievements = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const achievements = await AchievementService.getAchievements(userId);

    return res.json(successResponse(achievements));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 取得已解鎖成就
 * GET /api/achievements/unlocked
 */
export const getUnlockedAchievements = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const achievements = await AchievementService.getUnlockedAchievements(userId);

    return res.json(successResponse(achievements));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 取得成就進度摘要
 * GET /api/achievements/progress
 */
export const getAchievementProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const progress = await AchievementService.getAchievementProgress(userId);

    return res.json(successResponse(progress));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 手動檢查成就（用於測試）
 * POST /api/achievements/check
 */
export const checkAchievements = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const newlyUnlocked = await AchievementService.checkAndUnlockAchievements(userId);

    return res.json(
      successResponse({
        newlyUnlocked,
        count: newlyUnlocked.length,
      })
    );
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};
