import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AuthService } from '../../src/services/auth.service';
import { prisma } from '../../src/config/database';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken } from '../../src/utils/jwt.util';

// Mock dependencies
jest.mock('../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    deviceToken: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../../src/utils/jwt.util', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('應該成功註冊新用戶', async () => {
      const mockUser = {
        id: 'user-123',
        phone: '0912345678',
        name: '測試用戶',
        role: 'ELDER',
        points: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      const result = await AuthService.register({
        phone: '0912345678',
        password: 'password123',
        name: '測試用戶',
        role: 'ELDER',
      });

      expect(result.user).toBeDefined();
      expect(result.user.phone).toBe('0912345678');
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('access-token');
    });

    it('應該拒絕重複的手機號碼', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        phone: '0912345678',
      });

      await expect(
        AuthService.register({
          phone: '0912345678',
          password: 'password123',
          name: '測試用戶',
          role: 'ELDER',
        })
      ).rejects.toThrow('此手機號碼已被註冊');
    });
  });

  describe('login', () => {
    it('應該成功登入', async () => {
      const mockUser = {
        id: 'user-123',
        phone: '0912345678',
        password: 'hashed-password',
        name: '測試用戶',
        role: 'ELDER',
        points: 100,
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      const result = await AuthService.login('0912345678', 'password123');

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe('user-123');
      expect(result.tokens.accessToken).toBe('access-token');
    });

    it('應該拒絕錯誤的密碼', async () => {
      const mockUser = {
        id: 'user-123',
        phone: '0912345678',
        password: 'hashed-password',
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        AuthService.login('0912345678', 'wrong-password')
      ).rejects.toThrow('手機號碼或密碼錯誤');
    });

    it('應該拒絕不存在的用戶', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        AuthService.login('0999999999', 'password123')
      ).rejects.toThrow('手機號碼或密碼錯誤');
    });
  });

  describe('changePassword', () => {
    it('應該成功修改密碼', async () => {
      const mockUser = {
        id: 'user-123',
        password: 'old-hashed-password',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, password: 'new-hashed-password' });

      const result = await AuthService.changePassword(
        'user-123',
        'old-password',
        'new-password'
      );

      expect(result.success).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 10);
    });

    it('應該拒絕錯誤的舊密碼', async () => {
      const mockUser = {
        id: 'user-123',
        password: 'hashed-password',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        AuthService.changePassword('user-123', 'wrong-old', 'new-password')
      ).rejects.toThrow('目前密碼錯誤');
    });
  });

  describe('registerDeviceToken', () => {
    it('應該成功註冊裝置 Token', async () => {
      const mockDeviceToken = {
        id: 'device-123',
        userId: 'user-123',
        token: 'fcm-token',
        platform: 'android',
      };

      (prisma.deviceToken.upsert as jest.Mock).mockResolvedValue(mockDeviceToken);

      const result = await AuthService.registerDeviceToken(
        'user-123',
        'fcm-token',
        'android'
      );

      expect(result).toBeDefined();
      expect(result.token).toBe('fcm-token');
    });
  });
});
