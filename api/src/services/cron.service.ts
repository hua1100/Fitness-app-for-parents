import cron from 'node-cron';
import { prisma } from '../config/database';
import { sendPushToUser } from '../utils/fcm.util';
import { BindingService } from './binding.service';

// 不活躍天數閾值
const INACTIVITY_DAYS = 3;

// 定時任務服務
export const CronService = {
  // 初始化所有定時任務
  initialize() {
    // 每日活躍度檢查（每天早上 9 點執行）
    cron.schedule('0 9 * * *', async () => {
      console.log('執行每日活躍度檢查...');
      await this.checkInactivity();
    });

    // 清理過期的綁定碼（每小時執行）
    cron.schedule('0 * * * *', async () => {
      console.log('清理過期資料...');
      await this.cleanupExpiredData();
    });

    console.log('定時任務已初始化');
  },

  // 檢查長輩活躍度
  async checkInactivity() {
    try {
      const inactivityThreshold = new Date();
      inactivityThreshold.setDate(inactivityThreshold.getDate() - INACTIVITY_DAYS);

      // 查找超過閾值天數未活躍的長輩
      const inactiveElders = await prisma.user.findMany({
        where: {
          role: 'ELDER',
          lastActiveAt: {
            lt: inactivityThreshold,
          },
        },
        select: {
          id: true,
          name: true,
          lastActiveAt: true,
        },
      });

      console.log(`發現 ${inactiveElders.length} 位不活躍長輩`);

      // 通知每位長輩綁定的子女
      for (const elder of inactiveElders) {
        const daysSinceActive = Math.floor(
          (Date.now() - elder.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        const childIds = await BindingService.getBoundChildIds(elder.id);

        if (childIds.length > 0) {
          // 發送推播通知給子女
          for (const childId of childIds) {
            await sendPushToUser(childId, {
              title: '活動提醒',
              body: `${elder.name} 已經 ${daysSinceActive} 天沒有開啟 App 了`,
              data: {
                type: 'INACTIVITY',
                elderId: elder.id,
                daysSinceActive: daysSinceActive.toString(),
              },
            });
          }

          // 建立通知記錄
          await prisma.notification.createMany({
            data: childIds.map((childId) => ({
              userId: childId,
              type: 'INACTIVITY',
              title: '活動提醒',
              body: `${elder.name} 已經 ${daysSinceActive} 天沒有開啟 App 了`,
              data: { elderId: elder.id, daysSinceActive },
            })),
          });
        }
      }

      console.log('活躍度檢查完成');
    } catch (error) {
      console.error('活躍度檢查失敗:', error);
    }
  },

  // 清理過期資料
  async cleanupExpiredData() {
    try {
      // 清理過期的未確認綁定（超過 24 小時）
      const expiredBindings = await prisma.binding.deleteMany({
        where: {
          confirmedAt: null,
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      console.log(`已清理 ${expiredBindings.count} 個過期綁定請求`);

      // 清理超過 30 天的已讀通知
      const oldNotifications = await prisma.notification.deleteMany({
        where: {
          isRead: true,
          createdAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      console.log(`已清理 ${oldNotifications.count} 個舊通知`);
    } catch (error) {
      console.error('清理過期資料失敗:', error);
    }
  },

  // 手動觸發活躍度檢查（測試用）
  async manualCheckInactivity() {
    await this.checkInactivity();
  },
};

export default CronService;
