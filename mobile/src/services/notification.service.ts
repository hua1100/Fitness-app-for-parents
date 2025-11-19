import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { StorageService } from './storage.service';
import Config from 'react-native-config';

// 通知處理回調類型
export type NotificationHandler = (
  notification: FirebaseMessagingTypes.RemoteMessage
) => void;

// 通知服務
class NotificationServiceClass {
  private foregroundHandler: NotificationHandler | null = null;
  private backgroundHandler: NotificationHandler | null = null;
  private unsubscribeForeground: (() => void) | null = null;

  // 初始化通知服務
  async initialize(): Promise<void> {
    // 請求通知權限
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.warn('通知權限未授予');
      return;
    }

    // 取得 FCM Token
    await this.getToken();

    // 監聽 Token 刷新
    messaging().onTokenRefresh(async (token) => {
      console.log('FCM Token 已刷新');
      await this.registerTokenWithServer(token);
    });

    // 監聽前景通知
    this.unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('收到前景通知:', remoteMessage);
      if (this.foregroundHandler) {
        this.foregroundHandler(remoteMessage);
      }
    });

    // 處理背景通知點擊（應用程式從背景喚醒）
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('從背景通知開啟應用:', remoteMessage);
      if (this.backgroundHandler) {
        this.backgroundHandler(remoteMessage);
      }
    });

    // 檢查應用程式是否從關閉狀態由通知開啟
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      console.log('從關閉狀態由通知開啟:', initialNotification);
      if (this.backgroundHandler) {
        this.backgroundHandler(initialNotification);
      }
    }

    console.log('通知服務已初始化');
  }

  // 停止服務
  cleanup(): void {
    if (this.unsubscribeForeground) {
      this.unsubscribeForeground();
      this.unsubscribeForeground = null;
    }
  }

  // 請求通知權限
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log('通知權限狀態:', authStatus);
      return enabled;
    } catch (error) {
      console.error('請求通知權限失敗:', error);
      return false;
    }
  }

  // 取得 FCM Token
  async getToken(): Promise<string | null> {
    try {
      // iOS 需要先取得 APNS Token
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
      }

      const token = await messaging().getToken();
      console.log('FCM Token:', token);

      // 向伺服器註冊 Token
      await this.registerTokenWithServer(token);

      return token;
    } catch (error) {
      console.error('取得 FCM Token 失敗:', error);
      return null;
    }
  }

  // 向伺服器註冊裝置 Token
  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      const accessToken = await StorageService.getAccessToken();
      if (!accessToken) {
        console.log('未登入，跳過 Token 註冊');
        return;
      }

      const baseUrl = Config.API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${baseUrl}/auth/device-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          token,
          platform: Platform.OS,
        }),
      });

      if (response.ok) {
        console.log('裝置 Token 已註冊');
      } else {
        console.error('裝置 Token 註冊失敗');
      }
    } catch (error) {
      console.error('註冊裝置 Token 錯誤:', error);
    }
  }

  // 設定前景通知處理器
  setForegroundHandler(handler: NotificationHandler): void {
    this.foregroundHandler = handler;
  }

  // 設定背景通知處理器
  setBackgroundHandler(handler: NotificationHandler): void {
    this.backgroundHandler = handler;
  }

  // 訂閱主題
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`已訂閱主題: ${topic}`);
    } catch (error) {
      console.error(`訂閱主題 ${topic} 失敗:`, error);
    }
  }

  // 取消訂閱主題
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`已取消訂閱主題: ${topic}`);
    } catch (error) {
      console.error(`取消訂閱主題 ${topic} 失敗:`, error);
    }
  }

  // 刪除 Token（登出時使用）
  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      console.log('FCM Token 已刪除');
    } catch (error) {
      console.error('刪除 FCM Token 失敗:', error);
    }
  }

  // 檢查通知權限狀態
  async checkPermission(): Promise<boolean> {
    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  // 取得 Badge 數量（iOS）
  async getBadgeCount(): Promise<number> {
    if (Platform.OS === 'ios') {
      // 需要額外的原生模組來取得 badge
      return 0;
    }
    return 0;
  }

  // 清除 Badge（iOS）
  async clearBadge(): Promise<void> {
    if (Platform.OS === 'ios') {
      // 需要額外的原生模組來清除 badge
    }
  }
}

// 匯出單例
export const NotificationService = new NotificationServiceClass();

export default NotificationService;
