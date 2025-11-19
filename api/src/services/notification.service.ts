import { prisma } from '../config/database';
import { NotificationType } from '@prisma/client';

// 通知服務
export const NotificationService = {
  // 取得通知列表
  async getNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    } = {}
  ) {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // 標記通知已讀
  async markAsRead(userId: string, notificationIds: string[]) {
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: { isRead: true },
    });

    return { success: true, count: notificationIds.length };
  },

  // 標記所有通知已讀
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true, count: result.count };
  },

  // 取得未讀通知數量
  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { count };
  },

  // 建立通知
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: any
  ) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data,
      },
    });
  },

  // 批次建立通知
  async createNotifications(
    userIds: string[],
    type: NotificationType,
    title: string,
    body: string,
    data?: any
  ) {
    return prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        title,
        body,
        data,
      })),
    });
  },

  // 刪除通知
  async deleteNotification(userId: string, notificationId: string) {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });

    return { success: true };
  },

  // 刪除所有通知
  async deleteAllNotifications(userId: string) {
    await prisma.notification.deleteMany({
      where: { userId },
    });

    return { success: true };
  },

  // 取得通知設定
  async getSettings(userId: string) {
    // 在這個簡化版本中，返回預設設定
    // 完整版本應該從資料庫讀取用戶設定
    return {
      exerciseStart: true,
      exerciseEnd: true,
      emergency: true,
      inactivity: true,
      achievement: true,
      rewardRedeemed: true,
      voiceNew: true,
      quietHoursStart: null,
      quietHoursEnd: null,
    };
  },

  // 更新通知設定
  async updateSettings(userId: string, settings: any) {
    // 在完整版本中，應該儲存到資料庫
    return settings;
  },
};

export default NotificationService;
