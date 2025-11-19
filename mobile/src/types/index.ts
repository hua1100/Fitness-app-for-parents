// 應用程式共用 TypeScript 類型定義

// 用戶角色
export type UserRole = 'ELDER' | 'CHILD';

// 運動狀態
export type ExerciseStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EMERGENCY';

// 緊急狀態
export type EmergencyStatus = 'ACTIVE' | 'CANCELLED' | 'RESOLVED';

// 通知類型
export type NotificationType =
  | 'EXERCISE_START'
  | 'EXERCISE_END'
  | 'EMERGENCY'
  | 'INACTIVITY'
  | 'ACHIEVEMENT'
  | 'REWARD_REDEEMED'
  | 'VOICE_NEW'
  | 'SYSTEM';

// 用戶
export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  totalPoints: number;
  lastActiveAt: string;
  createdAt: string;
}

// 綁定關係
export interface Binding {
  id: string;
  elderId: string;
  childId: string;
  elder?: User;
  child?: User;
  confirmedAt?: string;
  createdAt: string;
}

// 運動記錄
export interface ExerciseRecord {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  status: ExerciseStatus;
  pointsEarned: number;
  emergencyStatus?: EmergencyStatus;
  emergencyLat?: number;
  emergencyLng?: number;
  emergencyTime?: string;
  note?: string;
  createdAt: string;
}

// 通知
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

// 獎項
export interface Reward {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  iconUrl?: string;
  isSystem: boolean;
  createdBy?: string;
  targetUserId?: string;
  isActive: boolean;
  createdAt: string;
}

// 已兌換獎項
export interface RedeemedReward {
  id: string;
  userId: string;
  rewardId: string;
  reward?: Reward;
  redeemedAt: string;
}

// 成就
export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  iconUrl?: string;
  condition: AchievementCondition;
  pointsBonus: number;
}

// 成就條件
export interface AchievementCondition {
  type: string;
  value: number;
}

// 用戶成就
export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  achievement?: Achievement;
  unlockedAt: string;
  progress: number;
}

// 語音訊息
export interface VoiceMessage {
  id: string;
  senderId: string;
  receiverId: string;
  sender?: User;
  receiver?: User;
  fileUrl: string;
  duration: number;
  playCount: number;
  isActive: boolean;
  createdAt: string;
}

// API 回應
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

// API 錯誤
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// 分頁資訊
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 分頁參數
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 日期範圍參數
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

// 運動統計
export interface ExerciseStats {
  totalMinutes: number;
  totalPoints: number;
  exerciseCount: number;
  averageDuration: number;
  longestStreak: number;
  currentStreak: number;
}

// 位置
export interface Location {
  latitude: number;
  longitude: number;
}

// 裝置 Token
export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android';
}

// 認證 Token
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// 登入響應
export interface LoginResponse {
  user: User;
  tokens: TokenPair;
}

// 註冊請求
export interface RegisterRequest {
  phone: string;
  password: string;
  name: string;
  role: UserRole;
}

// 語音配額
export interface VoiceQuota {
  used: number;
  limit: number;
  remaining: number;
}

// 通知設定
export interface NotificationSettings {
  exerciseStart: boolean;
  exerciseEnd: boolean;
  emergency: boolean;
  inactivity: boolean;
  achievement: boolean;
  rewardRedeemed: boolean;
  voiceNew: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}
