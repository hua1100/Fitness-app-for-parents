import { baseApi, ApiResponse } from './baseApi';
import { User, TokenPair, LoginResponse, RegisterRequest } from '../../types';

// 認證 API
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 註冊
    register: builder.mutation<ApiResponse<LoginResponse>, RegisterRequest>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),

    // 登入
    login: builder.mutation<ApiResponse<LoginResponse>, { phone: string; password: string }>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),

    // 刷新 Token
    refreshToken: builder.mutation<ApiResponse<TokenPair>, { refreshToken: string }>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
    }),

    // 登出
    logout: builder.mutation<ApiResponse<{ message: string }>, { deviceToken?: string } | void>({
      query: (body) => ({
        url: '/auth/logout',
        method: 'POST',
        body: body || {},
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    // 取得當前用戶資訊
    getMe: builder.query<ApiResponse<User>, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    // 更新用戶資料
    updateMe: builder.mutation<ApiResponse<User>, { name?: string; avatarUrl?: string }>({
      query: (body) => ({
        url: '/auth/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    // 更新個人資料（別名）
    updateProfile: builder.mutation<ApiResponse<User>, { name?: string; phone?: string }>({
      query: (body) => ({
        url: '/auth/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    // 上傳頭像
    uploadAvatar: builder.mutation<ApiResponse<{ avatarUrl: string }>, FormData>({
      query: (formData) => ({
        url: '/auth/avatar',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),

    // 修改密碼
    changePassword: builder.mutation<
      ApiResponse<{ message: string }>,
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'POST',
        body: {
          oldPassword: body.currentPassword,
          newPassword: body.newPassword,
        },
      }),
    }),

    // 註冊裝置 Token
    registerDeviceToken: builder.mutation<
      ApiResponse<any>,
      { token: string; platform: 'ios' | 'android' }
    >({
      query: (body) => ({
        url: '/auth/device-token',
        method: 'POST',
        body,
      }),
    }),

    // 檢查手機號碼是否已存在
    checkPhone: builder.query<ApiResponse<{ exists: boolean }>, string>({
      query: (phone) => `/auth/check-phone?phone=${phone}`,
    }),

    // Line 登入
    lineLogin: builder.mutation<
      ApiResponse<LoginResponse>,
      { accessToken: string; role: 'ELDER' | 'CHILD' }
    >({
      query: (body) => ({
        url: '/oauth/line/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),

    // Google 登入
    googleLogin: builder.mutation<
      ApiResponse<LoginResponse>,
      { idToken: string; role: 'ELDER' | 'CHILD' }
    >({
      query: (body) => ({
        url: '/oauth/google/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useChangePasswordMutation,
  useRegisterDeviceTokenMutation,
  useLazyCheckPhoneQuery,
  useLineLoginMutation,
  useGoogleLoginMutation,
} = authApi;
