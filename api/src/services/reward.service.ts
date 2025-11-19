/**
 * 獎勵服務
 * 處理點數商城和獎項兌換相關業務邏輯
 */

import { PrismaClient, Reward, RedeemedReward, UserRole } from '@prisma/client';
import { NotificationService } from './notification.service';

const prisma = new PrismaClient();

interface CreateRewardInput {
  name: string;
  description?: string;
  pointsCost: number;
  iconUrl?: string;
  targetUserId?: string;
}

interface RewardFilter {
  isSystem?: boolean;
  targetUserId?: string;
  isActive?: boolean;
}

export const RewardService = {
  /**
   * 取得獎項列表
   */
  async getRewards(
    userId: string,
    filter: RewardFilter = {},
    page: number = 1,
    limit: number = 20
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('用戶不存在');
    }

    const where: any = {
      isActive: true,
    };

    // 系統獎項 + 針對該用戶的自訂獎項
    if (user.role === 'ELDER') {
      where.OR = [
        { isSystem: true },
        { targetUserId: userId },
      ];
    } else if (filter.targetUserId) {
      // 子女查看特定長輩的獎項
      where.OR = [
        { isSystem: true },
        { targetUserId: filter.targetUserId },
      ];
    }

    if (filter.isSystem !== undefined) {
      where.isSystem = filter.isSystem;
    }

    const [rewards, total] = await Promise.all([
      prisma.reward.findMany({
        where,
        orderBy: [
          { isSystem: 'desc' },
          { pointsCost: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.reward.count({ where }),
    ]);

    return {
      rewards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * 取得獎項詳情
   */
  async getRewardDetail(rewardId: string) {
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            redeemedRewards: true,
          },
        },
      },
    });

    if (!reward) {
      throw new Error('獎項不存在');
    }

    return reward;
  },

  /**
   * 兌換獎項
   */
  async redeemReward(userId: string, rewardId: string) {
    const [user, reward] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.reward.findUnique({ where: { id: rewardId } }),
    ]);

    if (!user) {
      throw new Error('用戶不存在');
    }

    if (!reward) {
      throw new Error('獎項不存在');
    }

    if (!reward.isActive) {
      throw new Error('此獎項已下架');
    }

    // 驗證是否可以兌換該獎項
    if (!reward.isSystem && reward.targetUserId !== userId) {
      throw new Error('無權兌換此獎項');
    }

    // 檢查點數是否足夠
    if (user.totalPoints < reward.pointsCost) {
      throw new Error('點數不足');
    }

    // 執行兌換（使用事務）
    const result = await prisma.$transaction(async (tx) => {
      // 扣除點數
      await tx.user.update({
        where: { id: userId },
        data: {
          totalPoints: {
            decrement: reward.pointsCost,
          },
        },
      });

      // 創建兌換記錄
      const redeemedReward = await tx.redeemedReward.create({
        data: {
          userId,
          rewardId,
        },
        include: {
          reward: true,
        },
      });

      return redeemedReward;
    });

    // 通知綁定的子女
    const bindings = await prisma.elderChildBinding.findMany({
      where: {
        elderId: userId,
        status: 'CONFIRMED',
      },
      select: {
        childId: true,
      },
    });

    if (bindings.length > 0) {
      const childIds = bindings.map((b) => b.childId);
      await NotificationService.sendNotification({
        userIds: childIds,
        type: 'REWARD_REDEEMED',
        title: '獎項已兌換',
        body: `${user.name} 兌換了「${reward.name}」`,
        data: {
          rewardId: reward.id,
          rewardName: reward.name,
          pointsCost: reward.pointsCost,
          elderId: userId,
        },
      });
    }

    return result;
  },

  /**
   * 取得已兌換獎項列表
   */
  async getRedeemedRewards(userId: string, page: number = 1, limit: number = 20) {
    const [redeemedRewards, total] = await Promise.all([
      prisma.redeemedReward.findMany({
        where: { userId },
        orderBy: { redeemedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reward: true,
        },
      }),
      prisma.redeemedReward.count({ where: { userId } }),
    ]);

    // 計算統計
    const stats = await prisma.redeemedReward.aggregate({
      where: { userId },
      _count: true,
      _sum: {
        reward: false, // Prisma 不支援這種寫法，改用下面方式
      },
    });

    const totalSpent = await prisma.redeemedReward.findMany({
      where: { userId },
      include: { reward: { select: { pointsCost: true } } },
    });

    const totalPointsSpent = totalSpent.reduce(
      (sum, r) => sum + r.reward.pointsCost,
      0
    );

    return {
      redeemedRewards,
      stats: {
        totalRedeemed: total,
        totalPointsSpent,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * 創建自訂獎項（子女為長輩創建）
   */
  async createCustomReward(childId: string, input: CreateRewardInput) {
    const child = await prisma.user.findUnique({
      where: { id: childId },
    });

    if (!child || child.role !== 'CHILD') {
      throw new Error('只有子女帳號可以創建自訂獎項');
    }

    // 驗證目標長輩是否已綁定
    if (input.targetUserId) {
      const binding = await prisma.elderChildBinding.findFirst({
        where: {
          childId,
          elderId: input.targetUserId,
          status: 'CONFIRMED',
        },
      });

      if (!binding) {
        throw new Error('尚未與該長輩綁定');
      }
    }

    const reward = await prisma.reward.create({
      data: {
        name: input.name,
        description: input.description,
        pointsCost: input.pointsCost,
        iconUrl: input.iconUrl,
        isSystem: false,
        createdBy: childId,
        targetUserId: input.targetUserId,
      },
    });

    return reward;
  },

  /**
   * 更新自訂獎項
   */
  async updateCustomReward(
    childId: string,
    rewardId: string,
    input: Partial<CreateRewardInput>
  ) {
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      throw new Error('獎項不存在');
    }

    if (reward.isSystem) {
      throw new Error('無法修改系統獎項');
    }

    if (reward.createdBy !== childId) {
      throw new Error('只能修改自己創建的獎項');
    }

    const updatedReward = await prisma.reward.update({
      where: { id: rewardId },
      data: {
        name: input.name,
        description: input.description,
        pointsCost: input.pointsCost,
        iconUrl: input.iconUrl,
      },
    });

    return updatedReward;
  },

  /**
   * 刪除自訂獎項（軟刪除）
   */
  async deleteCustomReward(childId: string, rewardId: string) {
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      throw new Error('獎項不存在');
    }

    if (reward.isSystem) {
      throw new Error('無法刪除系統獎項');
    }

    if (reward.createdBy !== childId) {
      throw new Error('只能刪除自己創建的獎項');
    }

    await prisma.reward.update({
      where: { id: rewardId },
      data: { isActive: false },
    });

    return { success: true };
  },

  /**
   * 取得用戶當前點數
   */
  async getUserPoints(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalPoints: true,
      },
    });

    if (!user) {
      throw new Error('用戶不存在');
    }

    return user.totalPoints;
  },
};
