import { Router } from 'express';
import { z } from 'zod';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  deleteAllNotifications,
  getSettings,
  updateSettings,
} from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

// 所有路由都需要認證
router.use(authenticate);

// 驗證 Schema
const markAsReadSchema = z.object({
  notificationIds: z.array(z.string()).min(1, '請至少選擇一個通知'),
});

const settingsSchema = z.object({
  exerciseStart: z.boolean().optional(),
  exerciseEnd: z.boolean().optional(),
  emergency: z.boolean().optional(),
  inactivity: z.boolean().optional(),
  achievement: z.boolean().optional(),
  rewardRedeemed: z.boolean().optional(),
  voiceNew: z.boolean().optional(),
  quietHoursStart: z.string().nullable().optional(),
  quietHoursEnd: z.string().nullable().optional(),
});

// 路由
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/mark-read', validate(markAsReadSchema), markAsRead);
router.post('/mark-all-read', markAllAsRead);
router.delete('/all', deleteAllNotifications);
router.delete('/:notificationId', deleteNotification);
router.get('/settings', getSettings);
router.patch('/settings', validate(settingsSchema), updateSettings);

export default router;
