import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

// XSS 清理選項
const xssOptions = {
  whiteList: {}, // 不允許任何 HTML 標籤
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script'],
};

// 遞迴清理物件中的字串
const sanitizeValue = (value: any): any => {
  if (typeof value === 'string') {
    // 清理 XSS
    let sanitized = xss(value, xssOptions);
    // 移除潛在的 SQL 注入字元（基本防護）
    sanitized = sanitized.replace(/['";\\]/g, '');
    return sanitized.trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    const sanitized: any = {};
    for (const key of Object.keys(value)) {
      sanitized[key] = sanitizeValue(value[key]);
    }
    return sanitized;
  }

  return value;
};

// 輸入消毒中介軟體
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // 清理 body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body);
    }

    // 清理 query
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeValue(req.query);
    }

    // 清理 params
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeValue(req.params);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// 敏感資料遮蔽（用於日誌）
export const maskSensitiveData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = [
    'password',
    'newPassword',
    'oldPassword',
    'currentPassword',
    'confirmPassword',
    'token',
    'accessToken',
    'refreshToken',
    'creditCard',
    'cvv',
  ];

  const masked: any = Array.isArray(data) ? [] : {};

  for (const key of Object.keys(data)) {
    if (sensitiveFields.includes(key)) {
      masked[key] = '***MASKED***';
    } else if (typeof data[key] === 'object') {
      masked[key] = maskSensitiveData(data[key]);
    } else {
      masked[key] = data[key];
    }
  }

  return masked;
};

// 電話號碼部分遮蔽
export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 4) return phone;
  return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
};

// 電子郵件部分遮蔽
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : '*'.repeat(local.length);
  return `${maskedLocal}@${domain}`;
};

// 驗證 Content-Type
export const validateContentType = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 只檢查有 body 的請求
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];

    // 跳過檔案上傳
    if (contentType?.includes('multipart/form-data')) {
      return next();
    }

    // 確保是 JSON
    if (!contentType?.includes('application/json')) {
      res.status(415).json({
        success: false,
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Content-Type 必須是 application/json',
        },
      });
      return;
    }
  }

  next();
};

// 防止參數污染
export const preventParameterPollution = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // 將重複的查詢參數轉為陣列的最後一個值
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      const value = req.query[key];
      if (Array.isArray(value)) {
        req.query[key] = value[value.length - 1];
      }
    }
  }

  next();
};

export default {
  sanitizeInput,
  maskSensitiveData,
  maskPhone,
  maskEmail,
  validateContentType,
  preventParameterPollution,
};
