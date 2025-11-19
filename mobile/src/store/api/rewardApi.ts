/**
 * 獎勵 API
 * RTK Query 端點定義
 */

import { baseApi } from './baseApi';
import { ApiResponse, Reward, RedeemedReward } from '../../types';

// 響應類型
interface RewardsResponse {
  rewards: Reward[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RedeemedRewardsResponse {
  redeemedRewards: Array<{
    id: string;
    redeemedAt: string;
    reward: Reward;
  }>;
  stats: {
    totalRedeemed: number;
    totalPointsSpent: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RewardDetailResponse extends Reward {
  creator?: {
    id: string;
    name: string;
  };
  _count?: {
    redeemedRewards: number;
  };
}

interface CreateRewardInput {
  name: string;
  description?: string;
  pointsCost: number;
  iconUrl?: string;
  targetUserId?: string;
}

export const rewardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 取得獎項列表
    getRewards: builder.query<
      ApiResponse<RewardsResponse>,
      { isSystem?: boolean; targetUserId?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: '/rewards',
        params,
      }),
      providesTags: ['Reward'],
    }),

    // 取得獎項詳情
    getRewardDetail: builder.query<ApiResponse<RewardDetailResponse>, string>({
      query: (rewardId) => `/rewards/${rewardId}`,
      providesTags: (result, error, id) => [{ type: 'Reward', id }],
    }),

    // 取得用戶當前點數
    getUserPoints: builder.query<ApiResponse<{ points: number }>, void>({
      query: () => '/rewards/points',
      providesTags: ['Reward'],
    }),

    // 兌換獎項
    redeemReward: builder.mutation<
      ApiResponse<{ id: string; reward: Reward; redeemedAt: string }>,
      string
    >({
      query: (rewardId) => ({
        url: `/rewards/${rewardId}/redeem`,
        method: 'POST',
      }),
      invalidatesTags: ['Reward'],
    }),

    // 取得已兌換獎項
    getRedeemedRewards: builder.query<
      ApiResponse<RedeemedRewardsResponse>,
      { page?: number; limit?: number }
    >({
      query: (params) => ({
        url: '/rewards/redeemed',
        params,
      }),
      providesTags: ['Reward'],
    }),

    // 創建自訂獎項
    createCustomReward: builder.mutation<ApiResponse<Reward>, CreateRewardInput>({
      query: (body) => ({
        url: '/rewards',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Reward'],
    }),

    // 更新自訂獎項
    updateCustomReward: builder.mutation<
      ApiResponse<Reward>,
      { rewardId: string; data: Partial<CreateRewardInput> }
    >({
      query: ({ rewardId, data }) => ({
        url: `/rewards/${rewardId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Reward'],
    }),

    // 刪除自訂獎項
    deleteCustomReward: builder.mutation<ApiResponse<null>, string>({
      query: (rewardId) => ({
        url: `/rewards/${rewardId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reward'],
    }),
  }),
});

export const {
  useGetRewardsQuery,
  useGetRewardDetailQuery,
  useGetUserPointsQuery,
  useRedeemRewardMutation,
  useGetRedeemedRewardsQuery,
  useCreateCustomRewardMutation,
  useUpdateCustomRewardMutation,
  useDeleteCustomRewardMutation,
} = rewardApi;
