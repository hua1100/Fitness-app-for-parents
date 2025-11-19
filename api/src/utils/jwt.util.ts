import jwt from 'jsonwebtoken';

// Token 類型
export interface TokenPayload {
  userId: string;
  role: 'ELDER' | 'CHILD';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// 取得 JWT 密鑰
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 環境變數未設定');
  }
  return secret;
};

const getRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET 環境變數未設定');
  }
  return secret;
};

// 生成 Access Token
export const generateAccessToken = (payload: TokenPayload): string => {
  const expiresIn = process.env.JWT_ACCESS_EXPIRES || '15m';
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn,
  });
};

// 生成 Refresh Token
export const generateRefreshToken = (payload: TokenPayload): string => {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES || '7d';
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn,
  });
};

// 生成 Token 對
export const generateTokenPair = (payload: TokenPayload): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

// 驗證 Access Token
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token 已過期');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('無效的 Token');
    }
    throw error;
  }
};

// 驗證 Refresh Token
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, getRefreshSecret()) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh Token 已過期');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('無效的 Refresh Token');
    }
    throw error;
  }
};

// 解碼 Token（不驗證）
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.decode(token) as TokenPayload | null;
    return decoded;
  } catch {
    return null;
  }
};

// 從 Authorization Header 提取 Token
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};
