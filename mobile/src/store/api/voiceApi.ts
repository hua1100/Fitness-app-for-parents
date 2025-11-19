/**
 * 語音 API
 * RTK Query 端點定義
 */

import { baseApi } from './baseApi';
import { ApiResponse, VoiceMessage, VoiceQuota } from '../../types';

// 響應類型
interface VoiceListResponse {
  voices: VoiceMessage[];
  stats: {
    totalCount: number;
    totalDuration: number;
    totalPlays: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UploadVoiceResponse {
  voiceMessage: VoiceMessage;
  quota: VoiceQuota;
}

interface DefaultVoice {
  id: string;
  name: string;
  text: string;
  fileUrl: string;
}

export const voiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 上傳語音
    uploadVoice: builder.mutation<
      ApiResponse<UploadVoiceResponse>,
      FormData
    >({
      query: (formData) => ({
        url: '/voice',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Voice'],
    }),

    // 取得語音列表
    getVoices: builder.query<
      ApiResponse<VoiceListResponse>,
      {
        elderId?: string;
        childId?: string;
        sortBy?: 'createdAt' | 'playCount' | 'duration';
        order?: 'asc' | 'desc';
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: '/voice',
        params,
      }),
      providesTags: ['Voice'],
    }),

    // 取得語音詳情
    getVoiceDetail: builder.query<ApiResponse<VoiceMessage>, string>({
      query: (voiceId) => `/voice/${voiceId}`,
      providesTags: (result, error, voiceId) => [{ type: 'Voice', id: voiceId }],
    }),

    // 記錄播放
    recordPlay: builder.mutation<
      ApiResponse<{ playCount: number; lastPlayedAt: string }>,
      string
    >({
      query: (voiceId) => ({
        url: `/voice/${voiceId}/play`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, voiceId) => [{ type: 'Voice', id: voiceId }],
    }),

    // 刪除語音
    deleteVoice: builder.mutation<ApiResponse<null>, string>({
      query: (voiceId) => ({
        url: `/voice/${voiceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Voice'],
    }),

    // 批次刪除
    batchDeleteVoices: builder.mutation<
      ApiResponse<{ deletedCount: number }>,
      { voiceIds: string[] }
    >({
      query: (body) => ({
        url: '/voice/batch-delete',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Voice'],
    }),

    // 取得配額
    getVoiceQuota: builder.query<
      ApiResponse<{ elderId: string; quota: VoiceQuota }>,
      string
    >({
      query: (elderId) => ({
        url: '/voice/quota',
        params: { elderId },
      }),
      providesTags: ['Voice'],
    }),

    // 取得隨機語音
    getRandomVoice: builder.query<
      ApiResponse<{ voice: VoiceMessage | null; message?: string }>,
      { excludeIds?: string[] }
    >({
      query: (params) => ({
        url: '/voice/random',
        params: {
          excludeIds: params.excludeIds?.join(','),
        },
      }),
    }),

    // 取得預設語音
    getDefaultVoices: builder.query<
      ApiResponse<{ defaultVoices: DefaultVoice[] }>,
      void
    >({
      query: () => '/voice/default',
    }),
  }),
});

export const {
  useUploadVoiceMutation,
  useGetVoicesQuery,
  useGetVoiceDetailQuery,
  useRecordPlayMutation,
  useDeleteVoiceMutation,
  useBatchDeleteVoicesMutation,
  useGetVoiceQuotaQuery,
  useGetRandomVoiceQuery,
  useLazyGetRandomVoiceQuery,
  useGetDefaultVoicesQuery,
} = voiceApi;
