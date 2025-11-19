import { Request, Response } from 'express';
import { ExerciseService } from '../services/exercise.service';
import { asyncHandler } from '../middlewares/error.middleware';

// 開始運動
export const startExercise = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const exercise = await ExerciseService.startExercise(userId);

  res.status(201).json({
    success: true,
    data: exercise,
  });
});

// 結束運動
export const endExercise = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { note } = req.body;

  const exercise = await ExerciseService.endExercise(userId, note);

  res.json({
    success: true,
    data: exercise,
  });
});

// 取得運動記錄列表
export const getExercises = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { page, limit, startDate, endDate } = req.query;

  const result = await ExerciseService.getExercises(userId, {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  });

  res.json({
    success: true,
    ...result,
  });
});

// 取得運動統計
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { period } = req.query;

  const stats = await ExerciseService.getStats(
    userId,
    period as 'day' | 'week' | 'month' | 'all'
  );

  res.json({
    success: true,
    data: stats,
  });
});

// 取得進行中的運動
export const getCurrentExercise = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const exercise = await ExerciseService.getCurrentExercise(userId);

  res.json({
    success: true,
    data: exercise,
  });
});

// 發送緊急求助
export const triggerEmergency = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { latitude, longitude } = req.body;

  const result = await ExerciseService.triggerEmergency(userId, latitude, longitude);

  res.json({
    success: true,
    data: result,
  });
});

// 取消緊急求助
export const cancelEmergency = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await ExerciseService.cancelEmergency(userId);

  res.json({
    success: true,
    data: result,
  });
});

// 取得長輩運動記錄（子女查看）
export const getElderExercises = asyncHandler(async (req: Request, res: Response) => {
  const childId = req.user!.id;
  const { elderId } = req.params;
  const { page, limit, startDate, endDate } = req.query;

  const result = await ExerciseService.getElderExercises(childId, elderId, {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  });

  res.json({
    success: true,
    ...result,
  });
});

// 取得長輩運動統計（子女查看）
export const getElderStats = asyncHandler(async (req: Request, res: Response) => {
  const childId = req.user!.id;
  const { elderId } = req.params;
  const { period } = req.query;

  // 驗證綁定關係會在 service 中處理
  const stats = await ExerciseService.getStats(
    elderId,
    period as 'day' | 'week' | 'month' | 'all'
  );

  res.json({
    success: true,
    data: stats,
  });
});
