/**
 * 成就 API
 * RTK Query 端點定義
 */

import { baseApi } from './baseApi';
import { ApiResponse, Achievement } from '../../types';

// 成就包含進度信息
interface AchievementWithProgress extends Achievement {
  isUnlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

// 已解鎖成就
interface UnlockedAchievement extends Achievement {
  unlockedAt: string;
}

// 成就進度摘要
interface AchievementProgressSummary {
  total: number;
  unlocked: number;
  locked: number;
  completionRate: number;
  totalBonusEarned: number;
}

// 檢查成就結果
interface CheckAchievementsResult {
  newlyUnlocked: UnlockedAchievement[];
  count: number;
}

export const achievementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 取得所有成就及進度
    getAchievements: builder.query<ApiResponse<AchievementWithProgress[]>, void>({
      query: () => '/achievements',
      providesTags: ['Achievement'],
    }),

    // 取得已解鎖成就
    getUnlockedAchievements: builder.query<ApiResponse<UnlockedAchievement[]>, void>({
      query: () => '/achievements/unlocked',
      providesTags: ['Achievement'],
    }),

    // 取得成就進度摘要
    getAchievementProgress: builder.query<ApiResponse<AchievementProgressSummary>, void>({
      query: () => '/achievements/progress',
      providesTags: ['Achievement'],
    }),

    // 檢查成就（手動觸發）
    checkAchievements: builder.mutation<ApiResponse<CheckAchievementsResult>, void>({
      query: () => ({
        url: '/achievements/check',
        method: 'POST',
      }),
      invalidatesTags: ['Achievement'],
    }),
  }),
});

export const {
  useGetAchievementsQuery,
  useGetUnlockedAchievementsQuery,
  useGetAchievementProgressQuery,
  useCheckAchievementsMutation,
} = achievementApi;
