import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

// 驗證位置類型
type ValidationTarget = 'body' | 'query' | 'params';

// 驗證中介軟體生成器
export const validate = (
  schema: ZodSchema,
  target: ValidationTarget = 'body'
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dataToValidate = req[target];
      const validatedData = await schema.parseAsync(dataToValidate);

      // 將驗證後的資料放回請求
      req[target] = validatedData;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((e) => ({
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

      next(error);
    }
  };
};

// 常用驗證 Schema

// 分頁參數
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// 電話號碼（台灣格式）
export const phoneSchema = z.string()
  .regex(/^09\d{8}$/, '請輸入有效的手機號碼格式（09xxxxxxxx）');

// 密碼（至少 8 位，包含數字和字母）
export const passwordSchema = z.string()
  .min(8, '密碼至少需要 8 個字元')
  .regex(/[a-zA-Z]/, '密碼需要包含至少一個字母')
  .regex(/[0-9]/, '密碼需要包含至少一個數字');

// 用戶名稱
export const nameSchema = z.string()
  .min(1, '名稱不能為空')
  .max(50, '名稱不能超過 50 個字元');

// UUID/CUID
export const idSchema = z.string()
  .min(1, 'ID 不能為空');

// 日期範圍
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  { message: '開始日期不能晚於結束日期' }
);

// 綁定碼
export const bindingCodeSchema = z.string()
  .length(6, '綁定碼必須是 6 位數字')
  .regex(/^\d{6}$/, '綁定碼必須是 6 位數字');

// 經緯度
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// 通用 ID 參數驗證
export const idParamSchema = z.object({
  id: idSchema,
});

// 多重驗證中介軟體（同時驗證多個位置）
export const validateMultiple = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const errors: Array<{ field: string; message: string }> = [];

      // 驗證 body
      if (schemas.body) {
        try {
          req.body = await schemas.body.parseAsync(req.body);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(
              ...error.errors.map((e) => ({
                field: `body.${e.path.join('.')}`,
                message: e.message,
              }))
            );
          }
        }
      }

      // 驗證 query
      if (schemas.query) {
        try {
          req.query = await schemas.query.parseAsync(req.query);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(
              ...error.errors.map((e) => ({
                field: `query.${e.path.join('.')}`,
                message: e.message,
              }))
            );
          }
        }
      }

      // 驗證 params
      if (schemas.params) {
        try {
          req.params = await schemas.params.parseAsync(req.params);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(
              ...error.errors.map((e) => ({
                field: `params.${e.path.join('.')}`,
                message: e.message,
              }))
            );
          }
        }
      }

      if (errors.length > 0) {
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

      next();
    } catch (error) {
      next(error);
    }
  };
};
