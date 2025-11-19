/**
 * 語音控制器
 * 處理語音相關 HTTP 請求
 */

import { Request, Response } from 'express';
import { VoiceService } from '../services/voice.service';
import { successResponse, errorResponse } from '../utils/response';

/**
 * 上傳語音
 * POST /api/voice
 */
export const uploadVoice = async (req: Request, res: Response) => {
  try {
    const senderId = req.user!.id;
    const { elderId, duration } = req.body;

    if (!elderId) {
      return res.status(400).json(errorResponse('請指定長輩 ID'));
    }

    if (!req.file) {
      return res.status(400).json(errorResponse('請上傳語音檔案'));
    }

    const result = await VoiceService.uploadVoice(
      senderId,
      elderId,
      req.file.buffer,
      parseInt(duration) || 0,
      req.file.originalname
    );

    return res.status(201).json(successResponse(result, '語音上傳成功'));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 取得語音列表
 * GET /api/voice
 */
export const getVoiceList = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      elderId,
      childId,
      sortBy,
      order,
      page = '1',
      limit = '20',
    } = req.query;

    const result = await VoiceService.getVoiceList(userId, {
      elderId: elderId as string,
      childId: childId as string,
      sortBy: sortBy as any,
      order: order as any,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    return res.json(successResponse(result));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 取得語音詳情
 * GET /api/voice/:voiceId
 */
export const getVoiceDetail = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { voiceId } = req.params;

    const voice = await VoiceService.getVoiceDetail(voiceId, userId);

    return res.json(successResponse(voice));
  } catch (error: any) {
    if (error.message.includes('不存在')) {
      return res.status(404).json(errorResponse(error.message));
    }
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 記錄播放
 * POST /api/voice/:voiceId/play
 */
export const recordPlay = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { voiceId } = req.params;

    const result = await VoiceService.recordPlay(voiceId, userId);

    return res.json(successResponse(result));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 刪除語音
 * DELETE /api/voice/:voiceId
 */
export const deleteVoice = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { voiceId } = req.params;

    await VoiceService.deleteVoice(voiceId, userId);

    return res.json(successResponse(null, '語音刪除成功'));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 批次刪除
 * POST /api/voice/batch-delete
 */
export const batchDelete = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { voiceIds } = req.body;

    if (!voiceIds || !Array.isArray(voiceIds) || voiceIds.length === 0) {
      return res.status(400).json(errorResponse('請提供要刪除的語音 ID'));
    }

    const result = await VoiceService.batchDelete(voiceIds, userId);

    return res.json(successResponse(result, `成功刪除 ${result.deletedCount} 段語音`));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 取得配額
 * GET /api/voice/quota
 */
export const getQuota = async (req: Request, res: Response) => {
  try {
    const childId = req.user!.id;
    const { elderId } = req.query;

    if (!elderId) {
      return res.status(400).json(errorResponse('請指定長輩 ID'));
    }

    const quota = await VoiceService.getQuota(childId, elderId as string);

    return res.json(successResponse({ elderId, quota }));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 取得隨機語音
 * GET /api/voice/random
 */
export const getRandomVoice = async (req: Request, res: Response) => {
  try {
    const elderId = req.user!.id;
    const { excludeIds } = req.query;

    const excludeArray = excludeIds
      ? (excludeIds as string).split(',').filter(Boolean)
      : [];

    const voice = await VoiceService.getRandomVoice(elderId, excludeArray);

    if (!voice) {
      return res.json(
        successResponse({ voice: null, message: '沒有可播放的語音' })
      );
    }

    return res.json(successResponse({ voice }));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};

/**
 * 取得系統預設語音
 * GET /api/voice/default
 */
export const getDefaultVoices = async (req: Request, res: Response) => {
  try {
    const defaultVoices = await VoiceService.getDefaultVoices();

    return res.json(successResponse({ defaultVoices }));
  } catch (error: any) {
    return res.status(400).json(errorResponse(error.message));
  }
};
