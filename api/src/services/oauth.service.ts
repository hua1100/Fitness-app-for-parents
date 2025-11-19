import axios from 'axios';
import { prisma } from '../config/database';
import { generateTokenPair } from '../utils/jwt.util';
import { UserRole } from '@prisma/client';

// OAuth 提供者類型
export type OAuthProvider = 'line' | 'google';

// OAuth 用戶資訊
interface OAuthUserInfo {
  id: string;
  email?: string;
  name: string;
  avatarUrl?: string;
}

// Line Token 回應
interface LineTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  id_token: string;
}

// Line 用戶資訊
interface LineUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

// Google Token 回應
interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
  id_token: string;
}

// Google 用戶資訊
interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

// OAuth 服務
export const OAuthService = {
  // ========== Line Login ==========

  // 取得 Line 授權 URL
  getLineAuthUrl(state: string, role: UserRole): string {
    const clientId = process.env.LINE_CHANNEL_ID;
    const redirectUri = process.env.LINE_CALLBACK_URL;

    if (!clientId || !redirectUri) {
      throw new Error('Line OAuth 配置不完整');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: `${state}:${role}`,
      scope: 'profile openid',
    });

    return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
  },

  // 使用 Line 授權碼取得 Token
  async getLineToken(code: string): Promise<LineTokenResponse> {
    const clientId = process.env.LINE_CHANNEL_ID;
    const clientSecret = process.env.LINE_CHANNEL_SECRET;
    const redirectUri = process.env.LINE_CALLBACK_URL;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Line OAuth 配置不完整');
    }

    const response = await axios.post(
      'https://api.line.me/oauth2/v2.1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  },

  // 取得 Line 用戶資訊
  async getLineUserProfile(accessToken: string): Promise<LineUserProfile> {
    const response = await axios.get('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  },

  // Line 登入/註冊
  async loginWithLine(code: string, role: UserRole) {
    // 取得 access token
    const tokenData = await this.getLineToken(code);

    // 取得用戶資訊
    const profile = await this.getLineUserProfile(tokenData.access_token);

    // 處理用戶
    return this.handleOAuthUser(
      'line',
      {
        id: profile.userId,
        name: profile.displayName,
        avatarUrl: profile.pictureUrl,
      },
      role
    );
  },

  // ========== Google Login ==========

  // 取得 Google 授權 URL
  getGoogleAuthUrl(state: string, role: UserRole): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;

    if (!clientId || !redirectUri) {
      throw new Error('Google OAuth 配置不完整');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: `${state}:${role}`,
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  // 使用 Google 授權碼取得 Token
  async getGoogleToken(code: string): Promise<GoogleTokenResponse> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Google OAuth 配置不完整');
    }

    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  },

  // 取得 Google 用戶資訊
  async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  },

  // Google 登入/註冊
  async loginWithGoogle(code: string, role: UserRole) {
    // 取得 access token
    const tokenData = await this.getGoogleToken(code);

    // 取得用戶資訊
    const userInfo = await this.getGoogleUserInfo(tokenData.access_token);

    // 處理用戶
    return this.handleOAuthUser(
      'google',
      {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        avatarUrl: userInfo.picture,
      },
      role
    );
  },

  // 使用 ID Token 登入（移動端直接傳送 token）
  async loginWithGoogleIdToken(idToken: string, role: UserRole) {
    // 驗證 ID Token
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    const payload = response.data;

    if (!payload.sub) {
      throw new Error('無效的 Google ID Token');
    }

    return this.handleOAuthUser(
      'google',
      {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        avatarUrl: payload.picture,
      },
      role
    );
  },

  // 使用 Line Access Token 登入（移動端直接傳送 token）
  async loginWithLineAccessToken(accessToken: string, role: UserRole) {
    // 驗證並取得用戶資訊
    const profile = await this.getLineUserProfile(accessToken);

    return this.handleOAuthUser(
      'line',
      {
        id: profile.userId,
        name: profile.displayName,
        avatarUrl: profile.pictureUrl,
      },
      role
    );
  },

  // ========== 共用方法 ==========

  // 處理 OAuth 用戶（建立或更新）
  async handleOAuthUser(
    provider: OAuthProvider,
    userInfo: OAuthUserInfo,
    role: UserRole
  ) {
    const providerId = `${provider}_${userInfo.id}`;

    // 查找現有用戶
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: providerId },
          ...(userInfo.email ? [{ phone: userInfo.email }] : []),
        ],
      },
    });

    if (user) {
      // 更新用戶資訊
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: userInfo.name,
          avatarUrl: userInfo.avatarUrl || user.avatarUrl,
          lastActiveAt: new Date(),
        },
      });
    } else {
      // 建立新用戶
      user = await prisma.user.create({
        data: {
          phone: providerId, // 使用 provider_id 作為唯一標識
          passwordHash: '', // OAuth 用戶無密碼
          name: userInfo.name,
          role,
          avatarUrl: userInfo.avatarUrl,
        },
      });
    }

    // 生成 Token
    const tokens = generateTokenPair({
      userId: user.id,
      role: user.role,
    });

    // 返回用戶資料（不含密碼）
    const { passwordHash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  },
};

export default OAuthService;
