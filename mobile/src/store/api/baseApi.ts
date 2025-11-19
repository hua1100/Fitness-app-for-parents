import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

// API 基礎配置
const baseQuery = fetchBaseQuery({
  baseUrl: Config.API_BASE_URL || 'http://localhost:3000/api',
  prepareHeaders: async (headers) => {
    // 從 AsyncStorage 取得 token
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// 帶有 token 刷新邏輯的 baseQuery
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // 如果收到 401 錯誤，嘗試刷新 token
  if (result.error && result.error.status === 401) {
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    if (refreshToken) {
      // 嘗試刷新 token
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const data = refreshResult.data as {
          accessToken: string;
          refreshToken: string;
        };

        // 儲存新的 tokens
        await AsyncStorage.setItem('accessToken', data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.refreshToken);

        // 重試原始請求
        result = await baseQuery(args, api, extraOptions);
      } else {
        // 刷新失敗，清除 tokens
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        // TODO: 觸發登出邏輯
      }
    }
  }

  return result;
};

// 建立 API slice
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Auth',
    'User',
    'Binding',
    'Exercise',
    'Notification',
    'Reward',
    'Achievement',
    'Voice',
  ],
  endpoints: () => ({}),
});

// API 回應類型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
