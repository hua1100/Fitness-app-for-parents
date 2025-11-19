import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../middlewares/error.middleware';

// 註冊
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { phone, password, name, role } = req.body;

  const result = await AuthService.register({
    phone,
    password,
    name,
    role,
  });

  res.status(201).json({
    success: true,
    data: result,
  });
});

// 登入
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { phone, password } = req.body;

  const result = await AuthService.login({ phone, password });

  res.json({
    success: true,
    data: result,
  });
});

// 刷新 Token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_REFRESH_TOKEN',
        message: '缺少 Refresh Token',
      },
    });
    return;
  }

  const tokens = await AuthService.refreshToken(refreshToken);

  res.json({
    success: true,
    data: tokens,
  });
});

// 登出
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { deviceToken } = req.body;

  if (deviceToken) {
    // 只移除指定的裝置 Token
    await AuthService.removeDeviceToken(deviceToken);
  } else {
    // 移除所有裝置 Token
    await AuthService.removeAllDeviceTokens(userId);
  }

  res.json({
    success: true,
    data: { message: '登出成功' },
  });
});

// 取得當前用戶資訊
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const user = await AuthService.getProfile(userId);

  res.json({
    success: true,
    data: user,
  });
});

// 更新當前用戶資料
export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name, avatarUrl } = req.body;

  const user = await AuthService.updateProfile(userId, { name, avatarUrl });

  res.json({
    success: true,
    data: user,
  });
});

// 修改密碼
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { oldPassword, newPassword } = req.body;

  await AuthService.changePassword(userId, oldPassword, newPassword);

  res.json({
    success: true,
    data: { message: '密碼修改成功' },
  });
});

// 註冊裝置 Token
export const registerDeviceToken = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { token, platform } = req.body;

  const deviceToken = await AuthService.registerDeviceToken(userId, token, platform);

  res.json({
    success: true,
    data: deviceToken,
  });
});

// 檢查手機號碼是否已存在
export const checkPhone = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.query;

  if (!phone || typeof phone !== 'string') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PHONE',
        message: '請提供手機號碼',
      },
    });
    return;
  }

  const exists = await AuthService.checkPhoneExists(phone);

  res.json({
    success: true,
    data: { exists },
  });
});
