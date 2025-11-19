import cron from 'node-cron';
import { prisma } from '../config/database';
import { sendPushToUser, sendPushToUsers } from '../utils/fcm.util';
import { BindingService } from './binding.service';
import { NotificationService } from './notification.service';

// 不活躍天數閾值
const INACTIVITY_DAYS = 3;
// 運動超時閾值（小時）
const EXERCISE_TIMEOUT_HOURS = 2;

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

    // 每 15 分鐘檢查運動超時
    cron.schedule('*/15 * * * *', async () => {
      await this.checkExerciseTimeout();
    });

    console.log('定時任務已初始化');
  },

  // 檢查運動超時
  async checkExerciseTimeout() {
    try {
      const timeoutThreshold = new Date();
      timeoutThreshold.setHours(timeoutThreshold.getHours() - EXERCISE_TIMEOUT_HOURS);

      // 找出超時未結束的運動
      const timeoutExercises = await prisma.exerciseRecord.findMany({
        where: {
          endTime: null,
          startTime: {
            lt: timeoutThreshold,
          },
        },
        include: {
          elder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      for (const exercise of timeoutExercises) {
        const childIds = await BindingService.getBoundChildIds(exercise.elderId);

        if (childIds.length > 0) {
          // 通知子女
          await sendPushToUsers(childIds, {
            title: '運動超時提醒',
            body: `${exercise.elder.name} 的運動已超過 ${EXERCISE_TIMEOUT_HOURS} 小時未結束`,
            data: {
              type: 'EXERCISE_TIMEOUT',
              elderId: exercise.elderId,
              exerciseId: exercise.id,
            },
          });

          // 建立通知記錄
          await NotificationService.createNotifications(
            childIds,
            'EXERCISE_END',
            '運動超時提醒',
            `${exercise.elder.name} 的運動已超過 ${EXERCISE_TIMEOUT_HOURS} 小時未結束`,
            { elderId: exercise.elderId, exerciseId: exercise.id }
          );
        }
      }

      if (timeoutExercises.length > 0) {
        console.log(`運動超時檢查: 發現 ${timeoutExercises.length} 筆超時記錄`);
      }
    } catch (error) {
      console.error('檢查運動超時失敗:', error);
    }
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

  // 發送運動開始通知
  async notifyExerciseStart(
    elderId: string,
    elderName: string,
    exerciseId: string
  ) {
    try {
      const childIds = await BindingService.getBoundChildIds(elderId);

      if (childIds.length === 0) return;

      // 發送推播通知
      await sendPushToUsers(childIds, {
        title: '運動開始',
        body: `${elderName} 開始運動了！`,
        data: {
          type: 'EXERCISE_START',
          elderId,
          elderName,
          exerciseId,
        },
      });

      // 建立通知記錄
      await NotificationService.createNotifications(
        childIds,
        'EXERCISE_START',
        '運動開始',
        `${elderName} 開始運動了！`,
        { elderId, elderName, exerciseId }
      );

      console.log(`運動開始通知: 長輩 ${elderName}, 通知子女數: ${childIds.length}`);
    } catch (error) {
      console.error('發送運動開始通知失敗:', error);
    }
  },

  // 發送運動結束通知
  async notifyExerciseEnd(
    elderId: string,
    elderName: string,
    exerciseId: string,
    duration: number,
    pointsEarned: number
  ) {
    try {
      const childIds = await BindingService.getBoundChildIds(elderId);

      if (childIds.length === 0) return;

      const minutes = Math.floor(duration / 60);

      // 發送推播通知
      await sendPushToUsers(childIds, {
        title: '運動結束',
        body: `${elderName} 完成了 ${minutes} 分鐘運動，獲得 ${pointsEarned} 點！`,
        data: {
          type: 'EXERCISE_END',
          elderId,
          elderName,
          exerciseId,
          duration: duration.toString(),
          pointsEarned: pointsEarned.toString(),
        },
      });

      // 建立通知記錄
      await NotificationService.createNotifications(
        childIds,
        'EXERCISE_END',
        '運動結束',
        `${elderName} 完成了 ${minutes} 分鐘運動，獲得 ${pointsEarned} 點！`,
        { elderId, elderName, exerciseId, duration, pointsEarned }
      );

      console.log(`運動結束通知: 長輩 ${elderName}, 時長 ${minutes} 分鐘`);
    } catch (error) {
      console.error('發送運動結束通知失敗:', error);
    }
  },

  // 發送成就解鎖通知
  async notifyAchievementUnlocked(
    userId: string,
    achievementName: string,
    pointsBonus: number
  ) {
    try {
      await sendPushToUser(userId, {
        title: '🏆 成就解鎖！',
        body: `恭喜解鎖「${achievementName}」，獲得 ${pointsBonus} 點獎勵！`,
        data: {
          type: 'ACHIEVEMENT',
          achievementName,
          pointsBonus: pointsBonus.toString(),
        },
      });

      await NotificationService.createNotification(
        userId,
        'ACHIEVEMENT',
        '成就解鎖',
        `恭喜解鎖「${achievementName}」，獲得 ${pointsBonus} 點獎勵！`,
        { achievementName, pointsBonus }
      );
    } catch (error) {
      console.error('發送成就解鎖通知失敗:', error);
    }
  },

  // 發送獎勵兌換通知
  async notifyRewardRedeemed(
    elderId: string,
    elderName: string,
    rewardName: string,
    childId: string
  ) {
    try {
      // 通知子女長輩已兌換獎勵
      await sendPushToUser(childId, {
        title: '獎勵已兌換',
        body: `${elderName} 兌換了「${rewardName}」`,
        data: {
          type: 'REWARD_REDEEMED',
          elderId,
          elderName,
          rewardName,
        },
      });

      await NotificationService.createNotification(
        childId,
        'REWARD_REDEEMED',
        '獎勵已兌換',
        `${elderName} 兌換了「${rewardName}」`,
        { elderId, elderName, rewardName }
      );
    } catch (error) {
      console.error('發送獎勵兌換通知失敗:', error);
    }
  },
};

export default CronService;
