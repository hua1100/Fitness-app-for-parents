import { Request, Response } from 'express';
import { OAuthService } from '../services/oauth.service';
import { asyncHandler } from '../middlewares/error.middleware';
import { randomBytes } from 'crypto';

// 產生隨機 state
const generateState = (): string => {
  return randomBytes(16).toString('hex');
};

// 取得 Line 授權 URL
export const getLineAuthUrl = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.query;

  if (!role || (role !== 'ELDER' && role !== 'CHILD')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ROLE',
        message: '請提供有效的角色（ELDER 或 CHILD）',
      },
    });
    return;
  }

  const state = generateState();
  const authUrl = OAuthService.getLineAuthUrl(state, role as 'ELDER' | 'CHILD');

  res.json({
    success: true,
    data: {
      authUrl,
      state,
    },
  });
});

// Line 回調處理
export const lineCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || !state) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: '缺少必要參數',
      },
    });
    return;
  }

  // 解析 state 取得角色
  const [, role] = (state as string).split(':');

  if (!role || (role !== 'ELDER' && role !== 'CHILD')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_STATE',
        message: '無效的 state 參數',
      },
    });
    return;
  }

  const result = await OAuthService.loginWithLine(code as string, role as 'ELDER' | 'CHILD');

  res.json({
    success: true,
    data: result,
  });
});

// Line 移動端登入（使用 access token）
export const lineLogin = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, role } = req.body;

  if (!accessToken) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: '請提供 Line Access Token',
      },
    });
    return;
  }

  if (!role || (role !== 'ELDER' && role !== 'CHILD')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ROLE',
        message: '請提供有效的角色',
      },
    });
    return;
  }

  const result = await OAuthService.loginWithLineAccessToken(accessToken, role);

  res.json({
    success: true,
    data: result,
  });
});

// 取得 Google 授權 URL
export const getGoogleAuthUrl = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.query;

  if (!role || (role !== 'ELDER' && role !== 'CHILD')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ROLE',
        message: '請提供有效的角色（ELDER 或 CHILD）',
      },
    });
    return;
  }

  const state = generateState();
  const authUrl = OAuthService.getGoogleAuthUrl(state, role as 'ELDER' | 'CHILD');

  res.json({
    success: true,
    data: {
      authUrl,
      state,
    },
  });
});

// Google 回調處理
export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || !state) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: '缺少必要參數',
      },
    });
    return;
  }

  // 解析 state 取得角色
  const [, role] = (state as string).split(':');

  if (!role || (role !== 'ELDER' && role !== 'CHILD')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_STATE',
        message: '無效的 state 參數',
      },
    });
    return;
  }

  const result = await OAuthService.loginWithGoogle(code as string, role as 'ELDER' | 'CHILD');

  res.json({
    success: true,
    data: result,
  });
});

// Google 移動端登入（使用 ID token）
export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, role } = req.body;

  if (!idToken) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: '請提供 Google ID Token',
      },
    });
    return;
  }

  if (!role || (role !== 'ELDER' && role !== 'CHILD')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ROLE',
        message: '請提供有效的角色',
      },
    });
    return;
  }

  const result = await OAuthService.loginWithGoogleIdToken(idToken, role);

  res.json({
    success: true,
    data: result,
  });
});
