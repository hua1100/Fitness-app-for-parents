import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ExerciseService } from '../../src/services/exercise.service';
import { prisma } from '../../src/config/database';
import { BindingService } from '../../src/services/binding.service';
import { sendPushToUsers } from '../../src/utils/fcm.util';
import { emitToElderWatchers, broadcastEmergency, broadcastEmergencyCancel } from '../../src/websocket';
import { ExerciseStatus, EmergencyStatus } from '@prisma/client';

// Mock dependencies
jest.mock('../../src/config/database', () => ({
  prisma: {
    exerciseRecord: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/binding.service', () => ({
  BindingService: {
    getBoundChildIds: jest.fn(),
    isbound: jest.fn(),
  },
}));

jest.mock('../../src/utils/fcm.util', () => ({
  sendPushToUsers: jest.fn(),
}));

jest.mock('../../src/websocket', () => ({
  emitToElderWatchers: jest.fn(),
  broadcastEmergency: jest.fn(),
  broadcastEmergencyCancel: jest.fn(),
}));

describe('ExerciseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startExercise', () => {
    it('應該成功開始運動', async () => {
      const mockExercise = {
        id: 'exercise-123',
        userId: 'user-123',
        startTime: new Date(),
        status: ExerciseStatus.IN_PROGRESS,
      };

      const mockUser = {
        id: 'user-123',
        name: '測試長輩',
      };

      (prisma.exerciseRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.exerciseRecord.create as jest.Mock).mockResolvedValue(mockExercise);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (BindingService.getBoundChildIds as jest.Mock).mockResolvedValue(['child-1', 'child-2']);
      (sendPushToUsers as jest.Mock).mockResolvedValue(undefined);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await ExerciseService.startExercise('user-123');

      expect(result.id).toBe('exercise-123');
      expect(result.status).toBe(ExerciseStatus.IN_PROGRESS);
      expect(prisma.exerciseRecord.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          startTime: expect.any(Date),
          status: ExerciseStatus.IN_PROGRESS,
        },
      });
      expect(sendPushToUsers).toHaveBeenCalledWith(
        ['child-1', 'child-2'],
        expect.objectContaining({
          title: '運動開始',
        })
      );
      expect(emitToElderWatchers).toHaveBeenCalled();
    });

    it('應該拒絕已有進行中運動的情況', async () => {
      const existingExercise = {
        id: 'existing-exercise',
        userId: 'user-123',
        status: ExerciseStatus.IN_PROGRESS,
      };

      (prisma.exerciseRecord.findFirst as jest.Mock).mockResolvedValue(existingExercise);

      await expect(
        ExerciseService.startExercise('user-123')
      ).rejects.toThrow('已有進行中的運動');
    });

    it('應該在沒有綁定子女時仍能開始運動', async () => {
      const mockExercise = {
        id: 'exercise-123',
        userId: 'user-123',
        startTime: new Date(),
        status: ExerciseStatus.IN_PROGRESS,
      };

      (prisma.exerciseRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.exerciseRecord.create as jest.Mock).mockResolvedValue(mockExercise);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123', name: '測試' });
      (BindingService.getBoundChildIds as jest.Mock).mockResolvedValue([]);

      const result = await ExerciseService.startExercise('user-123');

      expect(result.id).toBe('exercise-123');
      expect(sendPushToUsers).not.toHaveBeenCalled();
    });
  });

  describe('endExercise', () => {
    it('應該成功結束運動並計算點數', async () => {
      const startTime = new Date(Date.now() - 30 * 60000); // 30 分鐘前
      const mockExercise = {
        id: 'exercise-123',
        userId: 'user-123',
        startTime,
        status: ExerciseStatus.IN_PROGRESS,
      };

      const updatedExercise = {
        ...mockExercise,
        endTime: expect.any(Date),
        durationMinutes: 30,
        status: ExerciseStatus.COMPLETED,
        pointsEarned: 30,
      };

      (prisma.exerciseRecord.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockExercise) // 查找進行中運動
        .mockResolvedValueOnce(null); // calculatePoints 查詢
      (prisma.exerciseRecord.findMany as jest.Mock).mockResolvedValue([]); // 今日運動記錄
      (prisma.exerciseRecord.update as jest.Mock).mockResolvedValue(updatedExercise);
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123', name: '測試' });
      (BindingService.getBoundChildIds as jest.Mock).mockResolvedValue(['child-1']);
      (sendPushToUsers as jest.Mock).mockResolvedValue(undefined);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await ExerciseService.endExercise('user-123');

      expect(prisma.exerciseRecord.update).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          totalPoints: { increment: expect.any(Number) },
        },
      });
    });

    it('應該拒絕沒有進行中運動的情況', async () => {
      (prisma.exerciseRecord.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        ExerciseService.endExercise('user-123')
      ).rejects.toThrow('沒有進行中的運動');
    });

    it('應該儲存運動備註', async () => {
      const startTime = new Date(Date.now() - 10 * 60000);
      const mockExercise = {
        id: 'exercise-123',
        userId: 'user-123',
        startTime,
        status: ExerciseStatus.IN_PROGRESS,
      };

      (prisma.exerciseRecord.findFirst as jest.Mock).mockResolvedValueOnce(mockExercise);
      (prisma.exerciseRecord.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.exerciseRecord.update as jest.Mock).mockResolvedValue({
        ...mockExercise,
        note: '感覺很好',
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123', name: '測試' });
      (BindingService.getBoundChildIds as jest.Mock).mockResolvedValue([]);

      await ExerciseService.endExercise('user-123', '感覺很好');

      expect(prisma.exerciseRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            note: '感覺很好',
          }),
        })
      );
    });
  });

  describe('calculatePoints', () => {
    it('應該計算正確的點數', async () => {
      (prisma.exerciseRecord.findMany as jest.Mock).mockResolvedValue([]);

      const points = await ExerciseService.calculatePoints('user-123', 30);

      expect(points).toBe(30); // 30 分鐘 * 1 點/分鐘
    });

    it('應該受每日上限限制', async () => {
      // 今日已獲得 90 點
      (prisma.exerciseRecord.findMany as jest.Mock).mockResolvedValue([
        { pointsEarned: 90 },
      ]);

      const points = await ExerciseService.calculatePoints('user-123', 30);

      expect(points).toBe(10); // 只能再獲得 10 點
    });

    it('應該在達到上限時返回 0', async () => {
      // 今日已獲得 100 點
      (prisma.exerciseRecord.findMany as jest.Mock).mockResolvedValue([
        { pointsEarned: 100 },
      ]);

      const points = await ExerciseService.calculatePoints('user-123', 30);

      expect(points).toBe(0);
    });
  });

  describe('getExercises', () => {
    it('應該返回分頁的運動記錄', async () => {
      const mockExercises = [
        { id: 'ex-1', startTime: new Date() },
        { id: 'ex-2', startTime: new Date() },
      ];

      (prisma.exerciseRecord.findMany as jest.Mock).mockResolvedValue(mockExercises);
      (prisma.exerciseRecord.count as jest.Mock).mockResolvedValue(50);

      const result = await ExerciseService.getExercises('user-123', { page: 1, limit: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(50);
      expect(result.meta.totalPages).toBe(25);
    });

    it('應該支援日期範圍篩選', async () => {
      (prisma.exerciseRecord.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.exerciseRecord.count as jest.Mock).mockResolvedValue(0);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await ExerciseService.getExercises('user-123', { startDate, endDate });

      expect(prisma.exerciseRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });
  });

  describe('getStats', () => {
    it('應該返回正確的統計數據', async () => {
      const mockExercises = [
        { durationMinutes: 30, pointsEarned: 30, startTime: new Date() },
        { durationMinutes: 20, pointsEarned: 20, startTime: new Date() },
      ];

      (prisma.exerciseRecord.findMany as jest.Mock)
        .mockResolvedValueOnce(mockExercises) // getStats 查詢
        .mockResolvedValueOnce([{ startTime: new Date() }]); // calculateStreak 查詢

      const result = await ExerciseService.getStats('user-123', 'all');

      expect(result.totalMinutes).toBe(50);
      expect(result.totalPoints).toBe(50);
      expect(result.exerciseCount).toBe(2);
      expect(result.averageDuration).toBe(25);
    });

    it('應該計算不同時段的統計', async () => {
      (prisma.exerciseRecord.findMany as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await ExerciseService.getStats('user-123', 'week');

      expect(prisma.exerciseRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe('calculateStreak', () => {
    it('應該正確計算連續天數', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const mockExercises = [
        { startTime: today },
        { startTime: yesterday },
      ];

      (prisma.exerciseRecord.findMany as jest.Mock).mockResolvedValue(mockExercises);

      const result = await ExerciseService.calculateStreak('user-123');

      expect(result.currentStreak).toBeGreaterThanOrEqual(1);
      expect(result.longestStreak).toBeGreaterThanOrEqual(1);
    });

    it('應該在沒有運動記錄時返回 0', async () => {
      (prisma.exerciseRecord.findMany as jest.Mock).mockResolvedValue([]);

      const result = await ExerciseService.calculateStreak('user-123');

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
    });
  });

  describe('getCurrentExercise', () => {
    it('應該返回進行中的運動', async () => {
      const mockExercise = {
        id: 'exercise-123',
        status: ExerciseStatus.IN_PROGRESS,
      };

      (prisma.exerciseRecord.findFirst as jest.Mock).mockResolvedValue(mockExercise);

      const result = await ExerciseService.getCurrentExercise('user-123');

      expect(result).toEqual(mockExercise);
    });

    it('應該在沒有進行中運動時返回 null', async () => {
      (prisma.exerciseRecord.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await ExerciseService.getCurrentExercise('user-123');

      expect(result).toBeNull();
    });
  });

  describe('triggerEmergency', () => {
    it('應該成功發送緊急求助', async () => {
      const mockExercise = {
        id: 'exercise-123',
        userId: 'user-123',
        status: ExerciseStatus.IN_PROGRESS,
      };

      (prisma.exerciseRecord.findFirst as jest.Mock).mockResolvedValue(mockExercise);
      (prisma.exerciseRecord.update as jest.Mock).mockResolvedValue({
        ...mockExercise,
        emergencyStatus: EmergencyStatus.ACTIVE,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123', name: '測試' });
      (BindingService.getBoundChildIds as jest.Mock).mockResolvedValue(['child-1']);
      (sendPushToUsers as jest.Mock).mockResolvedValue(undefined);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await ExerciseService.triggerEmergency('user-123', 25.0, 121.5);

      expect(result.success).toBe(true);
      expect(prisma.exerciseRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            emergencyStatus: EmergencyStatus.ACTIVE,
            emergencyLat: 25.0,
            emergencyLng: 121.5,
          }),
        })
      );
      expect(broadcastEmergency).toHaveBeenCalled();
    });

    it('應該在沒有進行中運動時拒絕', async () => {
      (prisma.exerciseRecord.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        ExerciseService.triggerEmergency('user-123')
      ).rejects.toThrow('沒有進行中的運動');
    });
  });

  describe('cancelEmergency', () => {
    it('應該成功取消緊急求助', async () => {
      const mockExercise = {
        id: 'exercise-123',
        userId: 'user-123',
        status: ExerciseStatus.IN_PROGRESS,
        emergencyStatus: EmergencyStatus.ACTIVE,
      };

      (prisma.exerciseRecord.findFirst as jest.Mock).mockResolvedValue(mockExercise);
      (prisma.exerciseRecord.update as jest.Mock).mockResolvedValue({
        ...mockExercise,
        emergencyStatus: EmergencyStatus.CANCELLED,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123', name: '測試' });

      const result = await ExerciseService.cancelEmergency('user-123');

      expect(result.success).toBe(true);
      expect(broadcastEmergencyCancel).toHaveBeenCalled();
    });

    it('應該在沒有緊急求助時拒絕', async () => {
      (prisma.exerciseRecord.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        ExerciseService.cancelEmergency('user-123')
      ).rejects.toThrow('沒有進行中的緊急求助');
    });
  });

  describe('getElderExercises', () => {
    it('應該返回綁定長輩的運動記錄', async () => {
      const mockExercises = [{ id: 'ex-1' }];

      (BindingService.isbound as jest.Mock).mockResolvedValue(true);
      (prisma.exerciseRecord.findMany as jest.Mock).mockResolvedValue(mockExercises);
      (prisma.exerciseRecord.count as jest.Mock).mockResolvedValue(1);

      const result = await ExerciseService.getElderExercises('child-1', 'elder-1');

      expect(result.data).toHaveLength(1);
    });

    it('應該拒絕未綁定的請求', async () => {
      (BindingService.isbound as jest.Mock).mockResolvedValue(false);

      await expect(
        ExerciseService.getElderExercises('child-1', 'elder-1')
      ).rejects.toThrow('未與此長輩綁定');
    });
  });
});
