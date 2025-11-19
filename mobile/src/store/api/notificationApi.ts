import { baseApi, ApiResponse, PaginationParams } from './baseApi';
import { Notification, NotificationSettings } from '../../types';

// 通知 API
export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 取得通知列表
    getNotifications: builder.query<
      ApiResponse<Notification[]>,
      PaginationParams & { unreadOnly?: boolean }
    >({
      query: (params) => ({
        url: '/notifications',
        params,
      }),
      providesTags: ['Notification'],
    }),

    // 取得未讀通知數量
    getUnreadCount: builder.query<ApiResponse<{ count: number }>, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification'],
    }),

    // 標記通知已讀
    markAsRead: builder.mutation<
      ApiResponse<{ success: boolean; count: number }>,
      { notificationIds: string[] }
    >({
      query: (body) => ({
        url: '/notifications/mark-read',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Notification'],
    }),

    // 標記所有通知已讀
    markAllAsRead: builder.mutation<ApiResponse<{ success: boolean; count: number }>, void>({
      query: () => ({
        url: '/notifications/mark-all-read',
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),

    // 刪除通知
    deleteNotification: builder.mutation<ApiResponse<{ message: string }>, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),

    // 刪除所有通知
    deleteAllNotifications: builder.mutation<ApiResponse<{ message: string }>, void>({
      query: () => ({
        url: '/notifications/all',
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),

    // 取得通知設定
    getSettings: builder.query<ApiResponse<NotificationSettings>, void>({
      query: () => '/notifications/settings',
    }),

    // 更新通知設定
    updateSettings: builder.mutation<ApiResponse<NotificationSettings>, Partial<NotificationSettings>>({
      query: (body) => ({
        url: '/notifications/settings',
        method: 'PATCH',
        body,
      }),
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} = notificationApi;
