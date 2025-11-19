/**
 * 成就服務
 * 處理成就解鎖和進度追蹤相關業務邏輯
 */

import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notification.service';

const prisma = new PrismaClient();

// 系統預設成就定義
const SYSTEM_ACHIEVEMENTS = [
  {
    code: 'FIRST_EXERCISE',
    name: '初次運動',
    description: '完成第一次運動',
    iconUrl: '/achievements/first-exercise.png',
    condition: { type: 'exercise_count', value: 1 },
    pointsBonus: 10,
  },
  {
    code: 'EXERCISE_10',
    name: '運動新手',
    description: '累計完成 10 次運動',
    iconUrl: '/achievements/exercise-10.png',
    condition: { type: 'exercise_count', value: 10 },
    pointsBonus: 50,
  },
  {
    code: 'EXERCISE_50',
    name: '運動達人',
    description: '累計完成 50 次運動',
    iconUrl: '/achievements/exercise-50.png',
    condition: { type: 'exercise_count', value: 50 },
    pointsBonus: 100,
  },
  {
    code: 'EXERCISE_100',
    name: '運動大師',
    description: '累計完成 100 次運動',
    iconUrl: '/achievements/exercise-100.png',
    condition: { type: 'exercise_count', value: 100 },
    pointsBonus: 200,
  },
  {
    code: 'STREAK_3',
    name: '連續三天',
    description: '連續 3 天運動',
    iconUrl: '/achievements/streak-3.png',
    condition: { type: 'streak_days', value: 3 },
    pointsBonus: 30,
  },
  {
    code: 'STREAK_7',
    name: '一週不間斷',
    description: '連續 7 天運動',
    iconUrl: '/achievements/streak-7.png',
    condition: { type: 'streak_days', value: 7 },
    pointsBonus: 70,
  },
  {
    code: 'STREAK_30',
    name: '月度挑戰',
    description: '連續 30 天運動',
    iconUrl: '/achievements/streak-30.png',
    condition: { type: 'streak_days', value: 30 },
    pointsBonus: 300,
  },
  {
    code: 'POINTS_100',
    name: '初級存款',
    description: '累計獲得 100 點數',
    iconUrl: '/achievements/points-100.png',
    condition: { type: 'total_points', value: 100 },
    pointsBonus: 20,
  },
  {
    code: 'POINTS_500',
    name: '中級存款',
    description: '累計獲得 500 點數',
    iconUrl: '/achievements/points-500.png',
    condition: { type: 'total_points', value: 500 },
    pointsBonus: 50,
  },
  {
    code: 'POINTS_1000',
    name: '高級存款',
    description: '累計獲得 1000 點數',
    iconUrl: '/achievements/points-1000.png',
    condition: { type: 'total_points', value: 1000 },
    pointsBonus: 100,
  },
  {
    code: 'FIRST_REDEEM',
    name: '首次兌換',
    description: '第一次兌換獎項',
    iconUrl: '/achievements/first-redeem.png',
    condition: { type: 'redeem_count', value: 1 },
    pointsBonus: 15,
  },
  {
    code: 'MINUTES_60',
    name: '一小時運動',
    description: '單次運動達 60 分鐘',
    iconUrl: '/achievements/minutes-60.png',
    condition: { type: 'single_exercise_minutes', value: 60 },
    pointsBonus: 50,
  },
];

export const AchievementService = {
  /**
   * 初始化系統預設成就
   */
  async initializeSystemAchievements() {
    for (const achievement of SYSTEM_ACHIEVEMENTS) {
      await prisma.achievement.upsert({
        where: { code: achievement.code },
        update: {
          name: achievement.name,
          description: achievement.description,
          iconUrl: achievement.iconUrl,
          condition: achievement.condition,
          pointsBonus: achievement.pointsBonus,
        },
        create: achievement,
      });
    }

    console.log(`已初始化 ${SYSTEM_ACHIEVEMENTS.length} 個系統成就`);
  },

  /**
   * 取得所有成就及用戶進度
   */
  async getAchievements(userId: string) {
    const [achievements, userAchievements, userStats] = await Promise.all([
      prisma.achievement.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
      }),
      this.getUserStats(userId),
    ]);

    // 組合成就與用戶進度
    const achievementsWithProgress = achievements.map((achievement) => {
      const userAchievement = userAchievements.find(
        (ua) => ua.achievementId === achievement.id
      );

      const progress = this.calculateProgress(
        achievement.condition as any,
        userStats
      );

      return {
        ...achievement,
        isUnlocked: !!userAchievement,
        unlockedAt: userAchievement?.unlockedAt || null,
        progress: userAchievement ? 100 : progress,
      };
    });

    return achievementsWithProgress;
  },

  /**
   * 取得已解鎖成就
   */
  async getUnlockedAchievements(userId: string) {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: 'desc' },
    });

    return userAchievements.map((ua) => ({
      ...ua.achievement,
      unlockedAt: ua.unlockedAt,
    }));
  },

  /**
   * 取得成就進度摘要
   */
  async getAchievementProgress(userId: string) {
    const [total, unlocked] = await Promise.all([
      prisma.achievement.count(),
      prisma.userAchievement.count({ where: { userId } }),
    ]);

    const totalBonusEarned = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: {
          select: { pointsBonus: true },
        },
      },
    });

    const bonusPoints = totalBonusEarned.reduce(
      (sum, ua) => sum + ua.achievement.pointsBonus,
      0
    );

    return {
      total,
      unlocked,
      locked: total - unlocked,
      completionRate: total > 0 ? Math.round((unlocked / total) * 100) : 0,
      totalBonusEarned: bonusPoints,
    };
  },

  /**
   * 檢查並解鎖成就
   */
  async checkAndUnlockAchievements(userId: string) {
    const [achievements, userAchievements, userStats] = await Promise.all([
      prisma.achievement.findMany(),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
      this.getUserStats(userId),
    ]);

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
    const newlyUnlocked: any[] = [];

    for (const achievement of achievements) {
      // 跳過已解鎖的成就
      if (unlockedIds.has(achievement.id)) continue;

      // 檢查是否滿足條件
      const condition = achievement.condition as any;
      if (this.checkCondition(condition, userStats)) {
        // 解鎖成就
        const userAchievement = await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: 100,
          },
        });

        // 發放獎勵點數
        if (achievement.pointsBonus > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              totalPoints: {
                increment: achievement.pointsBonus,
              },
            },
          });
        }

        newlyUnlocked.push({
          ...achievement,
          unlockedAt: userAchievement.unlockedAt,
        });
      }
    }

    // 發送成就解鎖通知
    if (newlyUnlocked.length > 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      for (const achievement of newlyUnlocked) {
        // 通知用戶本人
        await NotificationService.sendNotification({
          userIds: [userId],
          type: 'ACHIEVEMENT',
          title: '成就解鎖！',
          body: `恭喜您獲得「${achievement.name}」成就，獎勵 ${achievement.pointsBonus} 點數！`,
          data: {
            achievementId: achievement.id,
            achievementName: achievement.name,
            pointsBonus: achievement.pointsBonus,
          },
        });

        // 通知綁定的子女
        const bindings = await prisma.elderChildBinding.findMany({
          where: {
            elderId: userId,
            status: 'CONFIRMED',
          },
          select: { childId: true },
        });

        if (bindings.length > 0) {
          await NotificationService.sendNotification({
            userIds: bindings.map((b) => b.childId),
            type: 'ACHIEVEMENT',
            title: '長輩獲得成就',
            body: `${user?.name} 獲得了「${achievement.name}」成就！`,
            data: {
              achievementId: achievement.id,
              achievementName: achievement.name,
              elderId: userId,
            },
          });
        }
      }
    }

    return newlyUnlocked;
  },

  /**
   * 取得用戶統計數據
   */
  async getUserStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalPoints: true,
      },
    });

    const [exerciseCount, redeemCount, exerciseRecords] = await Promise.all([
      prisma.exerciseRecord.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      }),
      prisma.redeemedReward.count({
        where: { userId },
      }),
      prisma.exerciseRecord.findMany({
        where: {
          userId,
          status: 'COMPLETED',
        },
        select: {
          duration: true,
          startTime: true,
        },
        orderBy: { startTime: 'desc' },
      }),
    ]);

    // 計算連續天數
    const streakDays = this.calculateStreak(exerciseRecords);

    // 計算單次最長運動時間
    const maxSingleMinutes = exerciseRecords.reduce((max, record) => {
      const minutes = record.duration ? Math.floor(record.duration / 60) : 0;
      return Math.max(max, minutes);
    }, 0);

    // 計算累計獲得點數（需要追蹤歷史，這裡用總點數 + 已花費作為估算）
    const totalSpent = await prisma.redeemedReward.findMany({
      where: { userId },
      include: { reward: { select: { pointsCost: true } } },
    });
    const spentPoints = totalSpent.reduce((sum, r) => sum + r.reward.pointsCost, 0);
    const totalEarnedPoints = (user?.totalPoints || 0) + spentPoints;

    return {
      exerciseCount,
      streakDays,
      totalPoints: totalEarnedPoints,
      redeemCount,
      maxSingleMinutes,
    };
  },

  /**
   * 計算連續運動天數
   */
  calculateStreak(records: { startTime: Date }[]) {
    if (records.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 取得有運動的日期集合
    const exerciseDates = new Set<string>();
    records.forEach((record) => {
      const date = new Date(record.startTime);
      date.setHours(0, 0, 0, 0);
      exerciseDates.add(date.toISOString());
    });

    let streak = 0;
    let currentDate = new Date(today);

    // 從今天開始往回數
    while (true) {
      const dateStr = currentDate.toISOString();
      if (exerciseDates.has(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (streak === 0) {
        // 今天還沒運動，檢查昨天
        currentDate.setDate(currentDate.getDate() - 1);
        const yesterdayStr = currentDate.toISOString();
        if (exerciseDates.has(yesterdayStr)) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return streak;
  },

  /**
   * 計算成就進度百分比
   */
  calculateProgress(condition: { type: string; value: number }, stats: any) {
    let current = 0;

    switch (condition.type) {
      case 'exercise_count':
        current = stats.exerciseCount;
        break;
      case 'streak_days':
        current = stats.streakDays;
        break;
      case 'total_points':
        current = stats.totalPoints;
        break;
      case 'redeem_count':
        current = stats.redeemCount;
        break;
      case 'single_exercise_minutes':
        current = stats.maxSingleMinutes;
        break;
      default:
        return 0;
    }

    return Math.min(100, Math.round((current / condition.value) * 100));
  },

  /**
   * 檢查是否滿足成就條件
   */
  checkCondition(condition: { type: string; value: number }, stats: any) {
    switch (condition.type) {
      case 'exercise_count':
        return stats.exerciseCount >= condition.value;
      case 'streak_days':
        return stats.streakDays >= condition.value;
      case 'total_points':
        return stats.totalPoints >= condition.value;
      case 'redeem_count':
        return stats.redeemCount >= condition.value;
      case 'single_exercise_minutes':
        return stats.maxSingleMinutes >= condition.value;
      default:
        return false;
    }
  },
};
