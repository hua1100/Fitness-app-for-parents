import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 通知狀態
interface NotificationState {
  unreadCount: number;
  hasNewNotification: boolean;
}

const initialState: NotificationState = {
  unreadCount: 0,
  hasNewNotification: false,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // 設定未讀數量
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },

    // 增加未讀數量
    incrementUnread: (state) => {
      state.unreadCount += 1;
      state.hasNewNotification = true;
    },

    // 減少未讀數量
    decrementUnread: (state, action: PayloadAction<number>) => {
      state.unreadCount = Math.max(0, state.unreadCount - action.payload);
    },

    // 清除未讀數量
    clearUnread: (state) => {
      state.unreadCount = 0;
    },

    // 設定新通知標記
    setHasNewNotification: (state, action: PayloadAction<boolean>) => {
      state.hasNewNotification = action.payload;
    },

    // 清除通知狀態
    clearNotificationState: (state) => {
      return initialState;
    },
  },
});

export const {
  setUnreadCount,
  incrementUnread,
  decrementUnread,
  clearUnread,
  setHasNewNotification,
  clearNotificationState,
} = notificationSlice.actions;

// Selectors
export const selectUnreadCount = (state: { notification: NotificationState }) =>
  state.notification.unreadCount;
export const selectHasNewNotification = (state: { notification: NotificationState }) =>
  state.notification.hasNewNotification;

export default notificationSlice.reducer;
