/**
 * 獎勵控制器
 * 處理獎項相關 HTTP 請求
 */

import { Request, Response } from 'express';
import { RewardService } from '../services/reward.service';
import { successResponse, errorResponse } from '../utils/response';

/**
 * 取得獎項列表
 * GET /api/rewards
 */
export const getRewards = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { isSystem, targetUserId, page = '1', limit = '20' } = req.query;

    const filter: any = {};
    if (isSystem !== undefined) {
      filter.isSystem = isSystem === 'true';
    }
    if (targetUserId) {
      filter.targetUserId = targetUserId as string;
    }

    const result = await RewardService.getRewards(
      userId,
      filter,
      parseInt(page as string),
      parseInt(limit as string)
    );

    return res.json(successResponse(result));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 取得獎項詳情
 * GET /api/rewards/:rewardId
 */
export const getRewardDetail = async (req: Request, res: Response) => {
  try {
    const { rewardId } = req.params;

    const reward = await RewardService.getRewardDetail(rewardId);

    return res.json(successResponse(reward));
  } catch (error: any) {
    return res.status(404).json(errorResponse(error.message));
  }
};

/**
 * 兌換獎項
 * POST /api/rewards/:rewardId/redeem
 */
export const redeemReward = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { rewardId } = req.params;

    const result = await RewardService.redeemReward(userId, rewardId);

    return res.json(successResponse(result, '兌換成功'));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 取得已兌換獎項
 * GET /api/rewards/redeemed
 */
export const getRedeemedRewards = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '20' } = req.query;

    const result = await RewardService.getRedeemedRewards(
      userId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    return res.json(successResponse(result));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 創建自訂獎項
 * POST /api/rewards
 */
export const createCustomReward = async (req: Request, res: Response) => {
  try {
    const childId = req.user!.id;
    const { name, description, pointsCost, iconUrl, targetUserId } = req.body;

    if (!name || !pointsCost) {
      return res.status(400).json(errorResponse('名稱和點數為必填'));
    }

    if (pointsCost < 1) {
      return res.status(400).json(errorResponse('點數必須大於 0'));
    }

    const reward = await RewardService.createCustomReward(childId, {
      name,
      description,
      pointsCost,
      iconUrl,
      targetUserId,
    });

    return res.status(201).json(successResponse(reward, '獎項創建成功'));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 更新自訂獎項
 * PATCH /api/rewards/:rewardId
 */
export const updateCustomReward = async (req: Request, res: Response) => {
  try {
    const childId = req.user!.id;
    const { rewardId } = req.params;
    const { name, description, pointsCost, iconUrl } = req.body;

    if (pointsCost !== undefined && pointsCost < 1) {
      return res.status(400).json(errorResponse('點數必須大於 0'));
    }

    const reward = await RewardService.updateCustomReward(childId, rewardId, {
      name,
      description,
      pointsCost,
      iconUrl,
    });

    return res.json(successResponse(reward, '獎項更新成功'));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 刪除自訂獎項
 * DELETE /api/rewards/:rewardId
 */
export const deleteCustomReward = async (req: Request, res: Response) => {
  try {
    const childId = req.user!.id;
    const { rewardId } = req.params;

    await RewardService.deleteCustomReward(childId, rewardId);

    return res.json(successResponse(null, '獎項刪除成功'));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 取得用戶當前點數
 * GET /api/rewards/points
 */
export const getUserPoints = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const points = await RewardService.getUserPoints(userId);

    return res.json(successResponse({ points }));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};
