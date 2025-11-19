import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// 自定義錯誤類別
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 常用錯誤
export const BadRequestError = (message: string) =>
  new AppError(400, 'BAD_REQUEST', message);

export const UnauthorizedError = (message: string = '未授權') =>
  new AppError(401, 'UNAUTHORIZED', message);

export const ForbiddenError = (message: string = '禁止訪問') =>
  new AppError(403, 'FORBIDDEN', message);

export const NotFoundError = (message: string = '資源不存在') =>
  new AppError(404, 'NOT_FOUND', message);

export const ConflictError = (message: string) =>
  new AppError(409, 'CONFLICT', message);

export const InternalError = (message: string = '內部伺服器錯誤') =>
  new AppError(500, 'INTERNAL_ERROR', message);

// 錯誤處理中介軟體
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('錯誤:', err);

  // 自定義應用錯誤
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Zod 驗證錯誤
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '資料驗證失敗',
        details: errors,
      },
    });
    return;
  }

  // Prisma 錯誤
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // 唯一性約束違反
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: '資料已存在',
            details: err.meta,
          },
        });
        return;

      case 'P2025':
        // 記錄不存在
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '找不到指定的資料',
          },
        });
        return;

      case 'P2003':
        // 外鍵約束違反
        res.status(400).json({
          success: false,
          error: {
            code: 'FOREIGN_KEY_ERROR',
            message: '關聯資料不存在',
          },
        });
        return;

      default:
        res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '資料庫操作失敗',
          },
        });
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '資料格式錯誤',
      },
    });
    return;
  }

  // JWT 錯誤
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '無效的認證 Token',
      },
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token 已過期',
      },
    });
    return;
  }

  // 預設錯誤
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? '伺服器內部錯誤'
        : err.message,
    },
  });
};

// 404 處理
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `路由 ${req.method} ${req.path} 不存在`,
    },
  });
};

// 異步處理包裝器
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
