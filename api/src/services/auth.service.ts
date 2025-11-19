import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateTokenPair, verifyRefreshToken, TokenPair } from '../utils/jwt.util';
import { UserRole } from '@prisma/client';

// 註冊請求
export interface RegisterInput {
  phone: string;
  password: string;
  name: string;
  role: UserRole;
}

// 登入請求
export interface LoginInput {
  phone: string;
  password: string;
}

// 更新用戶請求
export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string;
}

// 認證服務
export const AuthService = {
  // 註冊新用戶
  async register(input: RegisterInput) {
    const { phone, password, name, role } = input;

    // 檢查手機號碼是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      throw new Error('此手機號碼已被註冊');
    }

    // 加密密碼
    const passwordHash = await bcrypt.hash(password, 12);

    // 建立用戶
    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash,
        name,
        role,
      },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        avatarUrl: true,
        totalPoints: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    // 生成 Token
    const tokens = generateTokenPair({
      userId: user.id,
      role: user.role,
    });

    return { user, tokens };
  },

  // 登入
  async login(input: LoginInput) {
    const { phone, password } = input;

    // 查找用戶
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new Error('帳號或密碼錯誤');
    }

    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('帳號或密碼錯誤');
    }

    // 更新最後活躍時間
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    // 生成 Token
    const tokens = generateTokenPair({
      userId: user.id,
      role: user.role,
    });

    // 返回用戶資料（不含密碼）
    const { passwordHash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  },

  // 刷新 Token
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    // 驗證 Refresh Token
    const payload = verifyRefreshToken(refreshToken);

    // 檢查用戶是否存在
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new Error('用戶不存在');
    }

    // 生成新的 Token 對
    return generateTokenPair({
      userId: user.id,
      role: user.role,
    });
  },

  // 取得用戶資訊
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        avatarUrl: true,
        totalPoints: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('用戶不存在');
    }

    return user;
  },

  // 更新用戶資料
  async updateProfile(userId: string, input: UpdateUserInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        avatarUrl: true,
        totalPoints: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    return user;
  },

  // 修改密碼
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    // 取得用戶
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('用戶不存在');
    }

    // 驗證舊密碼
    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('舊密碼錯誤');
    }

    // 加密新密碼
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // 更新密碼
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return true;
  },

  // 註冊裝置 Token
  async registerDeviceToken(userId: string, token: string, platform: string) {
    // 檢查 Token 是否已存在
    const existingToken = await prisma.deviceToken.findUnique({
      where: { token },
    });

    if (existingToken) {
      // 如果 Token 屬於其他用戶，更新為當前用戶
      if (existingToken.userId !== userId) {
        await prisma.deviceToken.update({
          where: { token },
          data: { userId, platform },
        });
      }
      return existingToken;
    }

    // 建立新的裝置 Token
    return prisma.deviceToken.create({
      data: {
        userId,
        token,
        platform,
      },
    });
  },

  // 移除裝置 Token
  async removeDeviceToken(token: string) {
    await prisma.deviceToken.deleteMany({
      where: { token },
    });
    return true;
  },

  // 移除用戶所有裝置 Token（登出時使用）
  async removeAllDeviceTokens(userId: string) {
    await prisma.deviceToken.deleteMany({
      where: { userId },
    });
    return true;
  },

  // 檢查手機號碼是否已存在
  async checkPhoneExists(phone: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });
    return !!user;
  },
};

export default AuthService;
