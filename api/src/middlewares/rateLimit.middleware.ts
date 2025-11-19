import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// 通用 Rate Limiter 配置
const createRateLimiter = (
  windowMs: number,
  max: number,
  message: string
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // 使用用戶 ID（如有）或 IP
      return (req as any).user?.id || req.ip || 'unknown';
    },
    skip: (req: Request) => {
      // 跳過健康檢查端點
      return req.path === '/health' || req.path === '/api/health';
    },
  });
};

// API 通用限制：每分鐘 100 次請求
export const apiLimiter = createRateLimiter(
  60 * 1000, // 1 分鐘
  100,
  '請求過於頻繁，請稍後再試'
);

// 認證端點限制：每 15 分鐘 10 次請求（防止暴力破解）
export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 分鐘
  10,
  '登入嘗試過於頻繁，請 15 分鐘後再試'
);

// 註冊限制：每小時 5 次請求
export const registerLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 小時
  5,
  '註冊請求過於頻繁，請 1 小時後再試'
);

// 緊急求助限制：每分鐘 5 次（防止誤觸）
export const emergencyLimiter = createRateLimiter(
  60 * 1000, // 1 分鐘
  5,
  '緊急求助請求過於頻繁'
);

// 檔案上傳限制：每小時 20 次
export const uploadLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 小時
  20,
  '上傳請求過於頻繁，請稍後再試'
);

// 密碼修改限制：每小時 3 次
export const passwordLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 小時
  3,
  '密碼修改請求過於頻繁，請 1 小時後再試'
);

export default {
  apiLimiter,
  authLimiter,
  registerLimiter,
  emergencyLimiter,
  uploadLimiter,
  passwordLimiter,
};
