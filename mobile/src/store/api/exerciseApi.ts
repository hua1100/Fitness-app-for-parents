import { baseApi, ApiResponse, PaginationParams, DateRangeParams } from './baseApi';
import { ExerciseRecord, ExerciseStats } from '../../types';

// 運動 API
export const exerciseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 開始運動
    startExercise: builder.mutation<ApiResponse<ExerciseRecord>, void>({
      query: () => ({
        url: '/exercise/start',
        method: 'POST',
      }),
      invalidatesTags: ['Exercise'],
    }),

    // 結束運動
    endExercise: builder.mutation<ApiResponse<ExerciseRecord>, { note?: string } | void>({
      query: (body) => ({
        url: '/exercise/end',
        method: 'POST',
        body: body || {},
      }),
      invalidatesTags: ['Exercise'],
    }),

    // 取得運動記錄列表
    getExercises: builder.query<
      ApiResponse<ExerciseRecord[]>,
      PaginationParams & DateRangeParams
    >({
      query: (params) => ({
        url: '/exercise',
        params,
      }),
      providesTags: ['Exercise'],
    }),

    // 取得運動統計
    getStats: builder.query<ApiResponse<ExerciseStats>, { period?: string }>({
      query: (params) => ({
        url: '/exercise/stats',
        params,
      }),
      providesTags: ['Exercise'],
    }),

    // 取得進行中的運動
    getCurrentExercise: builder.query<ApiResponse<ExerciseRecord | null>, void>({
      query: () => '/exercise/current',
      providesTags: ['Exercise'],
    }),

    // 發送緊急求助
    triggerEmergency: builder.mutation<
      ApiResponse<{ success: boolean; exerciseId: string }>,
      { latitude?: number; longitude?: number }
    >({
      query: (body) => ({
        url: '/exercise/emergency',
        method: 'POST',
        body,
      }),
    }),

    // 取消緊急求助
    cancelEmergency: builder.mutation<ApiResponse<{ success: boolean }>, void>({
      query: () => ({
        url: '/exercise/emergency/cancel',
        method: 'POST',
      }),
    }),

    // 取得長輩運動記錄（子女）
    getElderExercises: builder.query<
      ApiResponse<ExerciseRecord[]>,
      { elderId: string } & PaginationParams & DateRangeParams
    >({
      query: ({ elderId, ...params }) => ({
        url: `/exercise/elder/${elderId}`,
        params,
      }),
      providesTags: ['Exercise'],
    }),

    // 取得長輩運動統計（子女）
    getElderStats: builder.query<
      ApiResponse<ExerciseStats>,
      { elderId: string; period?: string }
    >({
      query: ({ elderId, ...params }) => ({
        url: `/exercise/elder/${elderId}/stats`,
        params,
      }),
      providesTags: ['Exercise'],
    }),
  }),
});

export const {
  useStartExerciseMutation,
  useEndExerciseMutation,
  useGetExercisesQuery,
  useGetStatsQuery,
  useGetCurrentExerciseQuery,
  useTriggerEmergencyMutation,
  useCancelEmergencyMutation,
  useGetElderExercisesQuery,
  useGetElderStatsQuery,
} = exerciseApi;
