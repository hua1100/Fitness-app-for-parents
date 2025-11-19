import * as Sentry from '@sentry/node';
import { Express, Request, Response, NextFunction } from 'express';

// 初始化 Sentry
export const initSentry = (app: Express): void => {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.log('Sentry DSN 未設定，跳過初始化');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || '1.0.0',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      // HTTP 請求追蹤
      new Sentry.Integrations.Http({ tracing: true }),
    ],
    // 過濾敏感資料
    beforeSend(event) {
      // 移除敏感資訊
      if (event.request?.data) {
        const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken'];
        const data = event.request.data as any;

        sensitiveFields.forEach(field => {
          if (data[field]) {
            data[field] = '[FILTERED]';
          }
        });
      }
      return event;
    },
  });

  // 請求處理中介軟體
  app.use(Sentry.Handlers.requestHandler());

  // 追蹤中介軟體
  app.use(Sentry.Handlers.tracingHandler());

  console.log('Sentry 初始化完成');
};

// Sentry 錯誤處理中介軟體
export const sentryErrorHandler = Sentry.Handlers.errorHandler({
  shouldHandleError(error: any) {
    // 捕獲 400 以上的錯誤
    return !error.status || error.status >= 400;
  },
});

// 手動捕獲錯誤
export const captureError = (
  error: Error,
  context?: {
    user?: { id: string; role?: string };
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
): void => {
  Sentry.withScope((scope) => {
    if (context?.user) {
      scope.setUser({
        id: context.user.id,
        role: context.user.role,
      });
    }

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureException(error);
  });
};

// 捕獲訊息
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
): void => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureMessage(message, level);
  });
};

// 設置用戶上下文
export const setUserContext = (userId: string, role?: string): void => {
  Sentry.setUser({
    id: userId,
    role,
  });
};

// 清除用戶上下文
export const clearUserContext = (): void => {
  Sentry.setUser(null);
};

// 添加麵包屑（追蹤用戶操作）
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, any>
): void => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
};

// Express 錯誤處理器包裝
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      captureError(error, {
        user: (req as any).user,
        extra: {
          method: req.method,
          path: req.path,
          query: req.query,
        },
      });
      next(error);
    });
  };
};

export default {
  initSentry,
  sentryErrorHandler,
  captureError,
  captureMessage,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
  asyncHandler,
};
