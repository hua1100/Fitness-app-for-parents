export { Colors, DarkColors } from './colors';
export { Strings } from './strings';

// 字體大小（針對長輩設計）
export const FontSizes = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 22,
  xl: 26,
  xxl: 32,
  title: 28,
  header: 36,
} as const;

// 間距
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// 圓角
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  round: 9999,
} as const;

// 陰影
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
} as const;

// API 端點
export const Endpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
    deviceToken: '/auth/device-token',
  },
  binding: {
    generateCode: '/binding/generate-code',
    useCode: '/binding/use-code',
    confirm: '/binding/confirm',
    list: '/binding',
    unbind: (id: string) => `/binding/${id}`,
  },
  exercise: {
    start: '/exercise/start',
    end: '/exercise/end',
    list: '/exercise',
    stats: '/exercise/stats',
    current: '/exercise/current',
    emergency: '/exercise/emergency',
    cancelEmergency: '/exercise/emergency/cancel',
  },
  notification: {
    list: '/notifications',
    markRead: '/notifications/mark-read',
    unreadCount: '/notifications/unread-count',
    settings: '/notifications/settings',
  },
  reward: {
    list: '/rewards',
    redeem: (id: string) => `/rewards/${id}/redeem`,
    redeemed: '/rewards/redeemed',
    create: '/rewards',
    update: (id: string) => `/rewards/${id}`,
    delete: (id: string) => `/rewards/${id}`,
  },
  achievement: {
    list: '/achievements',
    unlocked: '/achievements/unlocked',
    progress: '/achievements/progress',
  },
  voice: {
    upload: '/voice',
    list: '/voice',
    play: (id: string) => `/voice/${id}/play`,
    delete: (id: string) => `/voice/${id}`,
    random: '/voice/random',
    quota: '/voice/quota',
  },
} as const;

// 限制常數
export const Limits = {
  maxVoiceDuration: 30, // 秒
  maxVoiceCount: 10,
  dailyPointsLimit: 100,
  bindingCodeExpiry: 5 * 60, // 秒
  inactivityDays: 3,
  minPasswordLength: 8,
  maxNameLength: 50,
  pageSize: 20,
} as const;
