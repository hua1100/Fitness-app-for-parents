import { prisma } from '../config/database';
import { ExerciseStatus, EmergencyStatus } from '@prisma/client';
import { BindingService } from './binding.service';
import { sendPushToUsers } from '../utils/fcm.util';
import { emitToElderWatchers, broadcastEmergency, broadcastEmergencyCancel } from '../websocket';

// 每日點數上限
const DAILY_POINTS_LIMIT = 100;

// 每分鐘點數
const POINTS_PER_MINUTE = 1;

// 運動服務
export const ExerciseService = {
  // 開始運動
  async startExercise(userId: string) {
    // 檢查是否有進行中的運動
    const ongoingExercise = await prisma.exerciseRecord.findFirst({
      where: {
        userId,
        status: ExerciseStatus.IN_PROGRESS,
      },
    });

    if (ongoingExercise) {
      throw new Error('已有進行中的運動');
    }

    // 建立運動記錄
    const exercise = await prisma.exerciseRecord.create({
      data: {
        userId,
        startTime: new Date(),
        status: ExerciseStatus.IN_PROGRESS,
      },
    });

    // 取得用戶資訊
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // 通知綁定的子女
    const childIds = await BindingService.getBoundChildIds(userId);
    if (childIds.length > 0) {
      // 推播通知
      await sendPushToUsers(childIds, {
        title: '運動開始',
        body: `${user?.name || '長輩'} 開始運動了`,
        data: {
          type: 'EXERCISE_START',
          elderId: userId,
          exerciseId: exercise.id,
        },
      });

      // WebSocket 即時通知
      emitToElderWatchers(userId, 'exercise:start', {
        elderId: userId,
        elderName: user?.name,
        exerciseId: exercise.id,
        startTime: exercise.startTime,
      });

      // 儲存通知記錄
      await prisma.notification.createMany({
        data: childIds.map((childId) => ({
          userId: childId,
          type: 'EXERCISE_START',
          title: '運動開始',
          body: `${user?.name || '長輩'} 開始運動了`,
          data: { elderId: userId, exerciseId: exercise.id },
        })),
      });
    }

    return exercise;
  },

  // 結束運動
  async endExercise(userId: string, note?: string) {
    // 查找進行中的運動
    const exercise = await prisma.exerciseRecord.findFirst({
      where: {
        userId,
        status: ExerciseStatus.IN_PROGRESS,
      },
    });

    if (!exercise) {
      throw new Error('沒有進行中的運動');
    }

    const endTime = new Date();
    const durationMinutes = Math.floor(
      (endTime.getTime() - exercise.startTime.getTime()) / 60000
    );

    // 計算點數
    const pointsEarned = await this.calculatePoints(userId, durationMinutes);

    // 更新運動記錄
    const updatedExercise = await prisma.exerciseRecord.update({
      where: { id: exercise.id },
      data: {
        endTime,
        durationMinutes,
        status: ExerciseStatus.COMPLETED,
        pointsEarned,
        note,
      },
    });

    // 更新用戶總點數
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: pointsEarned },
      },
    });

    // 取得用戶資訊
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // 通知綁定的子女
    const childIds = await BindingService.getBoundChildIds(userId);
    if (childIds.length > 0) {
      await sendPushToUsers(childIds, {
        title: '運動結束',
        body: `${user?.name || '長輩'} 完成了 ${durationMinutes} 分鐘運動`,
        data: {
          type: 'EXERCISE_END',
          elderId: userId,
          exerciseId: exercise.id,
        },
      });

      emitToElderWatchers(userId, 'exercise:end', {
        elderId: userId,
        elderName: user?.name,
        exerciseId: exercise.id,
        durationMinutes,
        pointsEarned,
      });

      await prisma.notification.createMany({
        data: childIds.map((childId) => ({
          userId: childId,
          type: 'EXERCISE_END',
          title: '運動結束',
          body: `${user?.name || '長輩'} 完成了 ${durationMinutes} 分鐘運動`,
          data: { elderId: userId, exerciseId: exercise.id, durationMinutes, pointsEarned },
        })),
      });
    }

    return updatedExercise;
  },

  // 計算點數（考慮每日上限）
  async calculatePoints(userId: string, durationMinutes: number): Promise<number> {
    // 取得今日已獲得的點數
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayExercises = await prisma.exerciseRecord.findMany({
      where: {
        userId,
        startTime: { gte: today },
        status: ExerciseStatus.COMPLETED,
      },
      select: { pointsEarned: true },
    });

    const todayPoints = todayExercises.reduce((sum, e) => sum + e.pointsEarned, 0);
    const remainingPoints = Math.max(0, DAILY_POINTS_LIMIT - todayPoints);

    // 計算本次可獲得的點數
    const earnedPoints = Math.min(durationMinutes * POINTS_PER_MINUTE, remainingPoints);

    return earnedPoints;
  },

  // 取得運動記錄列表
  async getExercises(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const { page = 1, limit = 20, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    const [exercises, total] = await Promise.all([
      prisma.exerciseRecord.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip,
        take: limit,
      }),
      prisma.exerciseRecord.count({ where }),
    ]);

    return {
      data: exercises,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // 取得運動統計
  async getStats(userId: string, period: 'day' | 'week' | 'month' | 'all' = 'all') {
    const now = new Date();
    let startDate: Date | undefined;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }

    const where: any = {
      userId,
      status: ExerciseStatus.COMPLETED,
    };

    if (startDate) {
      where.startTime = { gte: startDate };
    }

    const exercises = await prisma.exerciseRecord.findMany({
      where,
      select: {
        durationMinutes: true,
        pointsEarned: true,
        startTime: true,
      },
    });

    const totalMinutes = exercises.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
    const totalPoints = exercises.reduce((sum, e) => sum + e.pointsEarned, 0);
    const exerciseCount = exercises.length;
    const averageDuration = exerciseCount > 0 ? Math.round(totalMinutes / exerciseCount) : 0;

    // 計算連續天數
    const { currentStreak, longestStreak } = await this.calculateStreak(userId);

    return {
      totalMinutes,
      totalPoints,
      exerciseCount,
      averageDuration,
      currentStreak,
      longestStreak,
    };
  },

  // 計算連續運動天數
  async calculateStreak(userId: string) {
    const exercises = await prisma.exerciseRecord.findMany({
      where: {
        userId,
        status: ExerciseStatus.COMPLETED,
      },
      select: { startTime: true },
      orderBy: { startTime: 'desc' },
    });

    if (exercises.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // 取得有運動的日期（去重）
    const exerciseDays = new Set(
      exercises.map((e) => e.startTime.toISOString().split('T')[0])
    );

    const sortedDays = Array.from(exerciseDays).sort().reverse();
    const today = new Date().toISOString().split('T')[0];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // 計算當前連續天數
    for (let i = 0; i < sortedDays.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expected = expectedDate.toISOString().split('T')[0];

      if (sortedDays[i] === expected || (i === 0 && sortedDays[i] === today)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // 計算最長連續天數
    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedDays[i - 1]);
        const curr = new Date(sortedDays[i]);
        const diffDays = Math.floor((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  },

  // 取得進行中的運動
  async getCurrentExercise(userId: string) {
    return prisma.exerciseRecord.findFirst({
      where: {
        userId,
        status: ExerciseStatus.IN_PROGRESS,
      },
    });
  },

  // 發送緊急求助
  async triggerEmergency(userId: string, latitude?: number, longitude?: number) {
    // 查找進行中的運動
    const exercise = await prisma.exerciseRecord.findFirst({
      where: {
        userId,
        status: ExerciseStatus.IN_PROGRESS,
      },
    });

    if (!exercise) {
      throw new Error('沒有進行中的運動');
    }

    // 更新運動記錄
    await prisma.exerciseRecord.update({
      where: { id: exercise.id },
      data: {
        emergencyStatus: EmergencyStatus.ACTIVE,
        emergencyLat: latitude,
        emergencyLng: longitude,
        emergencyTime: new Date(),
      },
    });

    // 取得用戶資訊
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // 通知綁定的子女
    const childIds = await BindingService.getBoundChildIds(userId);
    if (childIds.length > 0) {
      await sendPushToUsers(childIds, {
        title: '緊急求助！',
        body: `${user?.name || '長輩'} 發出緊急求助！`,
        data: {
          type: 'EMERGENCY',
          elderId: userId,
          exerciseId: exercise.id,
          latitude: latitude?.toString(),
          longitude: longitude?.toString(),
        },
      });

      // WebSocket 廣播
      await broadcastEmergency(
        userId,
        user?.name || '長輩',
        latitude && longitude ? { latitude, longitude } : undefined
      );

      await prisma.notification.createMany({
        data: childIds.map((childId) => ({
          userId: childId,
          type: 'EMERGENCY',
          title: '緊急求助！',
          body: `${user?.name || '長輩'} 發出緊急求助！`,
          data: { elderId: userId, exerciseId: exercise.id, latitude, longitude },
        })),
      });
    }

    return { success: true, exerciseId: exercise.id };
  },

  // 取消緊急求助
  async cancelEmergency(userId: string) {
    const exercise = await prisma.exerciseRecord.findFirst({
      where: {
        userId,
        status: ExerciseStatus.IN_PROGRESS,
        emergencyStatus: EmergencyStatus.ACTIVE,
      },
    });

    if (!exercise) {
      throw new Error('沒有進行中的緊急求助');
    }

    await prisma.exerciseRecord.update({
      where: { id: exercise.id },
      data: {
        emergencyStatus: EmergencyStatus.CANCELLED,
      },
    });

    // 取得用戶資訊
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // 通知綁定的子女
    await broadcastEmergencyCancel(userId, user?.name || '長輩');

    return { success: true };
  },

  // 取得長輩運動記錄（子女查看）
  async getElderExercises(childId: string, elderId: string, options: any = {}) {
    // 驗證綁定關係
    const isBound = await BindingService.isbound(elderId, childId);
    if (!isBound) {
      throw new Error('未與此長輩綁定');
    }

    return this.getExercises(elderId, options);
  },
};

export default ExerciseService;
