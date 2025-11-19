import { DatabaseService } from './database.service';
import { NetworkService } from './network.service';
import { StorageService, StorageKeys } from './storage.service';
import Config from 'react-native-config';

// 同步狀態
export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  errorCount: number;
}

// 同步服務
class SyncServiceClass {
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  // 初始化同步服務
  async initialize(): Promise<void> {
    // 監聽網路連線恢復事件
    NetworkService.on('connected', () => {
      console.log('網路恢復，開始同步...');
      this.sync();
    });

    // 定期同步
    this.startPeriodicSync();

    console.log('同步服務已初始化');
  }

  // 停止服務
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // 開始定期同步
  private startPeriodicSync(): void {
    const intervalMs = parseInt(Config.SYNC_INTERVAL || '60000', 10);

    this.syncInterval = setInterval(() => {
      if (NetworkService.isConnected()) {
        this.sync();
      }
    }, intervalMs);
  }

  // 執行同步
  async sync(): Promise<void> {
    if (this.isSyncing) {
      console.log('同步正在進行中，跳過');
      return;
    }

    if (!NetworkService.isConnected()) {
      console.log('無網路連線，跳過同步');
      return;
    }

    this.isSyncing = true;
    console.log('開始資料同步...');

    try {
      // 取得待同步項目
      const queueItems = await DatabaseService.getSyncQueueItems(20);

      if (queueItems.length === 0) {
        console.log('沒有待同步的項目');
        return;
      }

      console.log(`待同步項目: ${queueItems.length}`);

      // 依序處理同步項目
      for (const item of queueItems) {
        try {
          await this.processSyncItem(item);
          await DatabaseService.removeSyncQueueItem(item.id);
        } catch (error) {
          console.error(`同步項目 ${item.id} 失敗:`, error);
          await DatabaseService.incrementSyncRetry(item.id);
        }
      }

      // 更新最後同步時間
      await StorageService.set(StorageKeys.LAST_SYNC, new Date().toISOString());

      console.log('資料同步完成');
    } catch (error) {
      console.error('同步過程發生錯誤:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // 處理單一同步項目
  private async processSyncItem(item: any): Promise<void> {
    const payload = JSON.parse(item.payload);
    const baseUrl = Config.API_BASE_URL || 'http://localhost:3000/api';
    const token = await StorageService.getAccessToken();

    let url: string;
    let method: string;
    let body: any;

    switch (item.entity_type) {
      case 'exercise':
        url = `${baseUrl}/exercise`;
        if (item.action === 'CREATE') {
          method = 'POST';
          body = payload;
        } else if (item.action === 'UPDATE') {
          url = `${baseUrl}/exercise/${item.entity_id}`;
          method = 'PATCH';
          body = payload;
        }
        break;

      // TODO: 添加其他實體類型的處理

      default:
        throw new Error(`未知的實體類型: ${item.entity_type}`);
    }

    const response = await fetch(url, {
      method: method!,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || '同步請求失敗');
    }

    const result = await response.json();

    // 如果是創建操作，更新本地記錄的 server_id
    if (item.action === 'CREATE' && result.data?.id) {
      if (item.entity_type === 'exercise') {
        await DatabaseService.markExerciseSynced(item.entity_id, result.data.id);
      }
    }
  }

  // 取得同步狀態
  async getStatus(): Promise<SyncStatus> {
    const queueItems = await DatabaseService.getSyncQueueItems(100);
    const lastSync = await StorageService.getString(StorageKeys.LAST_SYNC);

    const errorCount = queueItems.filter((item) => item.retry_count >= 3).length;

    return {
      isSyncing: this.isSyncing,
      lastSyncAt: lastSync,
      pendingCount: queueItems.length,
      errorCount,
    };
  }

  // 強制同步
  async forceSync(): Promise<void> {
    if (this.isSyncing) {
      // 等待當前同步完成
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isSyncing) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    await this.sync();
  }

  // 添加運動記錄到同步佇列
  async queueExerciseSync(
    action: 'CREATE' | 'UPDATE',
    exerciseId: string,
    data: any
  ): Promise<void> {
    // 運動相關操作優先級較高
    await DatabaseService.addToSyncQueue(action, 'exercise', exerciseId, data, 10);

    // 如果有網路，立即嘗試同步
    if (NetworkService.isConnected()) {
      setTimeout(() => this.sync(), 1000);
    }
  }

  // 清除所有待同步項目
  async clearQueue(): Promise<void> {
    await DatabaseService.executeSql('DELETE FROM sync_queue');
  }
}

// 匯出單例
export const SyncService = new SyncServiceClass();

export default SyncService;
