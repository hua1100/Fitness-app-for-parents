import { prisma } from '../config/database';
import { randomInt } from 'crypto';

// 綁定碼有效期（秒）
const BINDING_CODE_EXPIRY = 5 * 60; // 5 分鐘

// 臨時儲存綁定碼（生產環境應使用 Redis）
const bindingCodes = new Map<string, { elderId: string; expiresAt: Date }>();

// 綁定服務
export const BindingService = {
  // 生成綁定碼（長輩端）
  async generateCode(elderId: string) {
    // 驗證用戶是長輩
    const elder = await prisma.user.findUnique({
      where: { id: elderId },
      select: { id: true, role: true, name: true },
    });

    if (!elder || elder.role !== 'ELDER') {
      throw new Error('只有長輩可以生成綁定碼');
    }

    // 生成 6 位數字綁定碼
    const code = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + BINDING_CODE_EXPIRY * 1000);

    // 儲存綁定碼
    bindingCodes.set(code, { elderId, expiresAt });

    // 設定自動清理
    setTimeout(() => {
      bindingCodes.delete(code);
    }, BINDING_CODE_EXPIRY * 1000);

    return {
      code,
      expiresAt,
      expiresIn: BINDING_CODE_EXPIRY,
    };
  },

  // 使用綁定碼（子女端）
  async useCode(childId: string, code: string) {
    // 驗證用戶是子女
    const child = await prisma.user.findUnique({
      where: { id: childId },
      select: { id: true, role: true, name: true },
    });

    if (!child || child.role !== 'CHILD') {
      throw new Error('只有子女可以使用綁定碼');
    }

    // 查找綁定碼
    const bindingData = bindingCodes.get(code);

    if (!bindingData) {
      throw new Error('綁定碼無效或已過期');
    }

    // 檢查是否過期
    if (new Date() > bindingData.expiresAt) {
      bindingCodes.delete(code);
      throw new Error('綁定碼已過期');
    }

    const { elderId } = bindingData;

    // 檢查是否已經綁定
    const existingBinding = await prisma.binding.findUnique({
      where: {
        elderId_childId: { elderId, childId },
      },
    });

    if (existingBinding) {
      throw new Error('已經與此長輩綁定');
    }

    // 取得長輩資訊
    const elder = await prisma.user.findUnique({
      where: { id: elderId },
      select: { id: true, name: true, avatarUrl: true },
    });

    if (!elder) {
      throw new Error('長輩不存在');
    }

    // 建立待確認的綁定關係
    const binding = await prisma.binding.create({
      data: {
        elderId,
        childId,
        bindingCode: code,
      },
      include: {
        elder: {
          select: { id: true, name: true, avatarUrl: true },
        },
        child: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // 移除已使用的綁定碼
    bindingCodes.delete(code);

    return binding;
  },

  // 確認綁定（長輩端確認）
  async confirmBinding(elderId: string, bindingId: string) {
    // 查找綁定關係
    const binding = await prisma.binding.findFirst({
      where: {
        id: bindingId,
        elderId,
        confirmedAt: null,
      },
    });

    if (!binding) {
      throw new Error('綁定關係不存在或已確認');
    }

    // 確認綁定
    const confirmedBinding = await prisma.binding.update({
      where: { id: bindingId },
      data: {
        confirmedAt: new Date(),
        bindingCode: null, // 清除綁定碼
      },
      include: {
        elder: {
          select: { id: true, name: true, avatarUrl: true },
        },
        child: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return confirmedBinding;
  },

  // 取得綁定列表
  async getBindings(userId: string, userRole: 'ELDER' | 'CHILD') {
    if (userRole === 'ELDER') {
      // 長輩查看綁定的子女
      return prisma.binding.findMany({
        where: {
          elderId: userId,
          confirmedAt: { not: null },
        },
        include: {
          child: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              lastActiveAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // 子女查看綁定的長輩
      return prisma.binding.findMany({
        where: {
          childId: userId,
          confirmedAt: { not: null },
        },
        include: {
          elder: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              totalPoints: true,
              lastActiveAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
  },

  // 取得待確認的綁定請求（長輩端）
  async getPendingBindings(elderId: string) {
    return prisma.binding.findMany({
      where: {
        elderId,
        confirmedAt: null,
      },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // 解除綁定
  async unbind(userId: string, userRole: 'ELDER' | 'CHILD', bindingId: string) {
    // 查找綁定關係
    const binding = await prisma.binding.findFirst({
      where: {
        id: bindingId,
        ...(userRole === 'ELDER' ? { elderId: userId } : { childId: userId }),
      },
    });

    if (!binding) {
      throw new Error('綁定關係不存在');
    }

    // 刪除綁定關係
    await prisma.binding.delete({
      where: { id: bindingId },
    });

    return true;
  },

  // 拒絕綁定請求（長輩端）
  async rejectBinding(elderId: string, bindingId: string) {
    const binding = await prisma.binding.findFirst({
      where: {
        id: bindingId,
        elderId,
        confirmedAt: null,
      },
    });

    if (!binding) {
      throw new Error('綁定請求不存在');
    }

    await prisma.binding.delete({
      where: { id: bindingId },
    });

    return true;
  },

  // 檢查是否已綁定
  async isbound(elderId: string, childId: string): Promise<boolean> {
    const binding = await prisma.binding.findUnique({
      where: {
        elderId_childId: { elderId, childId },
      },
      select: { confirmedAt: true },
    });

    return !!binding?.confirmedAt;
  },

  // 取得綁定的子女 ID 列表（用於推播通知）
  async getBoundChildIds(elderId: string): Promise<string[]> {
    const bindings = await prisma.binding.findMany({
      where: {
        elderId,
        confirmedAt: { not: null },
      },
      select: { childId: true },
    });

    return bindings.map((b) => b.childId);
  },

  // 取得綁定的長輩 ID 列表
  async getBoundElderIds(childId: string): Promise<string[]> {
    const bindings = await prisma.binding.findMany({
      where: {
        childId,
        confirmedAt: { not: null },
      },
      select: { elderId: true },
    });

    return bindings.map((b) => b.elderId);
  },
};

export default BindingService;
