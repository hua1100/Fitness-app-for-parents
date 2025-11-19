import { Router } from 'express';
import { z } from 'zod';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateMe,
  changePassword,
  registerDeviceToken,
  checkPhone,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate, phoneSchema, passwordSchema, nameSchema } from '../middlewares/validation.middleware';

const router = Router();

// 驗證 Schema
const registerSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  name: nameSchema,
  role: z.enum(['ELDER', 'CHILD']),
});

const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, '請輸入密碼'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, '請提供 Refresh Token'),
});

const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  avatarUrl: z.string().url('請提供有效的 URL').optional(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '請輸入舊密碼'),
  newPassword: passwordSchema,
});

const deviceTokenSchema = z.object({
  token: z.string().min(1, '請提供裝置 Token'),
  platform: z.enum(['ios', 'android']),
});

// 公開路由
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refreshToken);
router.get('/check-phone', checkPhone);

// 需要認證的路由
router.use(authenticate);

router.post('/logout', logout);
router.get('/me', getMe);
router.patch('/me', validate(updateProfileSchema), updateMe);
router.post('/change-password', validate(changePasswordSchema), changePassword);
router.post('/device-token', validate(deviceTokenSchema), registerDeviceToken);

export default router;
