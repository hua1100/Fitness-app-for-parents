import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, TokenPayload } from '../utils/jwt.util';
import { prisma } from '../config/database';

// 擴展 Request 類型以包含用戶資訊
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'ELDER' | 'CHILD';
      };
    }
  }
}

// 認證中介軟體
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未提供認證 Token',
        },
      });
      return;
    }

    // 驗證 Token
    let payload: TokenPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: error.message || '無效的 Token',
        },
      });
      return;
    }

    // 驗證用戶是否存在
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用戶不存在',
        },
      });
      return;
    }

    // 更新最後活躍時間
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    // 將用戶資訊附加到請求
    req.user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('認證中介軟體錯誤:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '認證過程發生錯誤',
      },
    });
  }
};

// 可選認證中介軟體（不強制要求登入）
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      next();
      return;
    }

    // 嘗試驗證 Token
    try {
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, role: true },
      });

      if (user) {
        req.user = {
          id: user.id,
          role: user.role,
        };
      }
    } catch {
      // Token 無效時忽略，繼續執行
    }

    next();
  } catch (error) {
    next(error);
  }
};

// 角色檢查中介軟體
export const requireRole = (...roles: ('ELDER' | 'CHILD')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '需要登入',
        },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '權限不足',
        },
      });
      return;
    }

    next();
  };
};

// 長輩專用中介軟體
export const elderOnly = requireRole('ELDER');

// 子女專用中介軟體
export const childOnly = requireRole('CHILD');
