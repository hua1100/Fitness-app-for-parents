import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { EventEmitter } from 'events';

// 網路狀態類型
export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
}

// 網路服務事件發射器
class NetworkServiceClass extends EventEmitter {
  private subscription: NetInfoSubscription | null = null;
  private currentStatus: NetworkStatus = {
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    isWifi: false,
    isCellular: false,
  };

  // 初始化監聽
  initialize(): void {
    if (this.subscription) {
      return;
    }

    this.subscription = NetInfo.addEventListener(this.handleNetworkChange);
    console.log('網路狀態監聽已啟動');

    // 取得初始狀態
    NetInfo.fetch().then(this.handleNetworkChange);
  }

  // 停止監聽
  cleanup(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
      console.log('網路狀態監聽已停止');
    }
  }

  // 處理網路狀態變化
  private handleNetworkChange = (state: NetInfoState): void => {
    const newStatus: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      isWifi: state.type === 'wifi',
      isCellular: state.type === 'cellular',
    };

    const wasConnected = this.currentStatus.isConnected;
    this.currentStatus = newStatus;

    // 發射狀態變化事件
    this.emit('statusChange', newStatus);

    // 連線恢復事件
    if (!wasConnected && newStatus.isConnected) {
      console.log('網路連線已恢復');
      this.emit('connected');
    }

    // 斷線事件
    if (wasConnected && !newStatus.isConnected) {
      console.log('網路連線已斷開');
      this.emit('disconnected');
    }
  };

  // 取得當前狀態
  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  // 檢查是否連線
  isConnected(): boolean {
    return this.currentStatus.isConnected;
  }

  // 檢查網際網路是否可達
  isInternetReachable(): boolean {
    return this.currentStatus.isInternetReachable ?? false;
  }

  // 檢查是否為 WiFi
  isWifi(): boolean {
    return this.currentStatus.isWifi;
  }

  // 檢查是否為行動網路
  isCellular(): boolean {
    return this.currentStatus.isCellular;
  }

  // 主動刷新狀態
  async refresh(): Promise<NetworkStatus> {
    const state = await NetInfo.fetch();
    this.handleNetworkChange(state);
    return this.getStatus();
  }

  // 等待連線恢復
  waitForConnection(timeoutMs: number = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        this.removeListener('connected', onConnected);
        reject(new Error('等待網路連線超時'));
      }, timeoutMs);

      const onConnected = () => {
        clearTimeout(timeout);
        resolve();
      };

      this.once('connected', onConnected);
    });
  }
}

// 匯出單例
export const NetworkService = new NetworkServiceClass();

export default NetworkService;
