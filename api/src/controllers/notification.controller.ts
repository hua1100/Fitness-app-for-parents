import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { asyncHandler } from '../middlewares/error.middleware';

// 取得通知列表
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { page, limit, unreadOnly } = req.query;

  const result = await NotificationService.getNotifications(userId, {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    unreadOnly: unreadOnly === 'true',
  });

  res.json({
    success: true,
    ...result,
  });
});

// 標記通知已讀
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { notificationIds } = req.body;

  const result = await NotificationService.markAsRead(userId, notificationIds);

  res.json({
    success: true,
    data: result,
  });
});

// 標記所有通知已讀
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await NotificationService.markAllAsRead(userId);

  res.json({
    success: true,
    data: result,
  });
});

// 取得未讀通知數量
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await NotificationService.getUnreadCount(userId);

  res.json({
    success: true,
    data: result,
  });
});

// 刪除通知
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { notificationId } = req.params;

  await NotificationService.deleteNotification(userId, notificationId);

  res.json({
    success: true,
    data: { message: '通知已刪除' },
  });
});

// 刪除所有通知
export const deleteAllNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  await NotificationService.deleteAllNotifications(userId);

  res.json({
    success: true,
    data: { message: '所有通知已刪除' },
  });
});

// 取得通知設定
export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const settings = await NotificationService.getSettings(userId);

  res.json({
    success: true,
    data: settings,
  });
});

// 更新通知設定
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const settings = req.body;

  const updatedSettings = await NotificationService.updateSettings(userId, settings);

  res.json({
    success: true,
    data: updatedSettings,
  });
});
