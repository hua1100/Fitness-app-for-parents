import winston from 'winston';
import path from 'path';

// 日誌格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 控制台格式（開發環境）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// 建立 Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'fitness-api',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // 錯誤日誌檔案
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 所有日誌檔案
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 開發環境增加控制台輸出
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// HTTP 請求日誌
export const httpLogger = {
  log: (message: string, meta?: any) => {
    logger.info(message, { type: 'http', ...meta });
  },
};

// API 請求日誌
export const apiLogger = {
  request: (req: any) => {
    logger.info('API Request', {
      type: 'api_request',
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userId: req.user?.id,
    });
  },
  response: (req: any, statusCode: number, duration: number) => {
    logger.info('API Response', {
      type: 'api_response',
      method: req.method,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
    });
  },
  error: (req: any, error: any) => {
    logger.error('API Error', {
      type: 'api_error',
      method: req.method,
      path: req.path,
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
  },
};

// 認證日誌
export const authLogger = {
  login: (userId: string, success: boolean, ip?: string) => {
    logger.info('Login attempt', {
      type: 'auth',
      action: 'login',
      userId,
      success,
      ip,
    });
  },
  logout: (userId: string) => {
    logger.info('Logout', {
      type: 'auth',
      action: 'logout',
      userId,
    });
  },
  register: (userId: string, role: string) => {
    logger.info('User registered', {
      type: 'auth',
      action: 'register',
      userId,
      role,
    });
  },
  tokenRefresh: (userId: string) => {
    logger.debug('Token refreshed', {
      type: 'auth',
      action: 'token_refresh',
      userId,
    });
  },
};

// 運動日誌
export const exerciseLogger = {
  start: (userId: string, exerciseId: string) => {
    logger.info('Exercise started', {
      type: 'exercise',
      action: 'start',
      userId,
      exerciseId,
    });
  },
  end: (userId: string, exerciseId: string, duration: number, points: number) => {
    logger.info('Exercise ended', {
      type: 'exercise',
      action: 'end',
      userId,
      exerciseId,
      duration,
      points,
    });
  },
  emergency: (userId: string, exerciseId?: string) => {
    logger.warn('Emergency triggered', {
      type: 'exercise',
      action: 'emergency',
      userId,
      exerciseId,
    });
  },
};

// 通知日誌
export const notificationLogger = {
  sent: (userId: string, type: string, success: boolean) => {
    logger.info('Notification sent', {
      type: 'notification',
      action: 'sent',
      userId,
      notificationType: type,
      success,
    });
  },
  failed: (userId: string, type: string, error: string) => {
    logger.error('Notification failed', {
      type: 'notification',
      action: 'failed',
      userId,
      notificationType: type,
      error,
    });
  },
};

// 資料庫日誌
export const dbLogger = {
  query: (query: string, duration: number) => {
    logger.debug('Database query', {
      type: 'database',
      query,
      duration: `${duration}ms`,
    });
  },
  error: (operation: string, error: any) => {
    logger.error('Database error', {
      type: 'database',
      operation,
      error: error.message,
    });
  },
};

export default logger;
