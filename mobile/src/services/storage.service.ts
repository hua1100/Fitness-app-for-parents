import AsyncStorage from '@react-native-async-storage/async-storage';

// 儲存鍵名常數
export const StorageKeys = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_ROLE: 'userRole',
  USER_ID: 'userId',
  USER_DATA: 'userData',
  NOTIFICATION_SETTINGS: 'notificationSettings',
  THEME: 'theme',
  FONT_SIZE: 'fontSize',
  LAST_SYNC: 'lastSync',
  OFFLINE_QUEUE: 'offlineQueue',
} as const;

// 儲存服務
export const StorageService = {
  // 取得項目
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`StorageService.get 錯誤 (${key}):`, error);
      return null;
    }
  },

  // 取得字串
  async getString(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`StorageService.getString 錯誤 (${key}):`, error);
      return null;
    }
  },

  // 儲存項目
  async set(key: string, value: any): Promise<boolean> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.error(`StorageService.set 錯誤 (${key}):`, error);
      return false;
    }
  },

  // 刪除項目
  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`StorageService.remove 錯誤 (${key}):`, error);
      return false;
    }
  },

  // 批次刪除
  async multiRemove(keys: string[]): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('StorageService.multiRemove 錯誤:', error);
      return false;
    }
  },

  // 清除所有資料
  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('StorageService.clear 錯誤:', error);
      return false;
    }
  },

  // 取得所有鍵
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('StorageService.getAllKeys 錯誤:', error);
      return [];
    }
  },

  // Token 相關方法
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.multiSet([
      [StorageKeys.ACCESS_TOKEN, accessToken],
      [StorageKeys.REFRESH_TOKEN, refreshToken],
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return this.getString(StorageKeys.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return this.getString(StorageKeys.REFRESH_TOKEN);
  },

  async clearTokens(): Promise<void> {
    await this.multiRemove([
      StorageKeys.ACCESS_TOKEN,
      StorageKeys.REFRESH_TOKEN,
    ]);
  },

  // 用戶資料相關
  async setUserData(data: { id: string; role: string; [key: string]: any }): Promise<void> {
    await AsyncStorage.multiSet([
      [StorageKeys.USER_ID, data.id],
      [StorageKeys.USER_ROLE, data.role],
      [StorageKeys.USER_DATA, JSON.stringify(data)],
    ]);
  },

  async getUserRole(): Promise<'ELDER' | 'CHILD' | null> {
    const role = await this.getString(StorageKeys.USER_ROLE);
    return role as 'ELDER' | 'CHILD' | null;
  },

  async getUserId(): Promise<string | null> {
    return this.getString(StorageKeys.USER_ID);
  },

  async clearUserData(): Promise<void> {
    await this.multiRemove([
      StorageKeys.USER_ID,
      StorageKeys.USER_ROLE,
      StorageKeys.USER_DATA,
    ]);
  },

  // 登出時清除所有認證相關資料
  async clearAuthData(): Promise<void> {
    await this.multiRemove([
      StorageKeys.ACCESS_TOKEN,
      StorageKeys.REFRESH_TOKEN,
      StorageKeys.USER_ID,
      StorageKeys.USER_ROLE,
      StorageKeys.USER_DATA,
    ]);
  },
};

export default StorageService;
