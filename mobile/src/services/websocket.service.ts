import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import { StorageService } from './storage.service';
import { NetworkService } from './network.service';
import Config from 'react-native-config';

// WebSocket 事件類型
export interface EmergencyEvent {
  type: 'EMERGENCY' | 'EMERGENCY_CANCEL';
  elderId: string;
  elderName: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export interface ExerciseEvent {
  type: 'EXERCISE_START' | 'EXERCISE_END';
  elderId: string;
  elderName: string;
  exerciseId: string;
  timestamp: string;
}

// WebSocket 服務
class WebSocketServiceClass extends EventEmitter {
  private socket: Socket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;

  // 連線到 WebSocket 伺服器
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('WebSocket 已連線');
      return;
    }

    const token = await StorageService.getAccessToken();
    if (!token) {
      console.log('未登入，無法連線 WebSocket');
      return;
    }

    const serverUrl = Config.WEBSOCKET_URL || Config.API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  // 設定事件監聽器
  private setupEventListeners(): void {
    if (!this.socket) return;

    // 連線成功
    this.socket.on('connect', () => {
      console.log('WebSocket 連線成功');
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    // 連線錯誤
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket 連線錯誤:', error.message);
      this.emit('error', error);
    });

    // 斷線
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket 斷線:', reason);
      this.emit('disconnected', reason);
    });

    // 重新連線
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket 重新連線成功 (第 ${attemptNumber} 次)`);
      this.emit('reconnected', attemptNumber);
    });

    // 重新連線嘗試
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`WebSocket 嘗試重新連線 (第 ${attemptNumber} 次)`);
      this.reconnectAttempts = attemptNumber;
    });

    // 重新連線失敗
    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket 重新連線失敗');
      this.emit('reconnect_failed');
    });

    // 緊急求助事件
    this.socket.on('emergency', (data: EmergencyEvent) => {
      console.log('收到緊急求助:', data);
      this.emit('emergency', data);
    });

    // 取消緊急求助
    this.socket.on('emergency:cancel', (data: EmergencyEvent) => {
      console.log('緊急求助已取消:', data);
      this.emit('emergency:cancel', data);
    });

    // 運動開始事件
    this.socket.on('exercise:start', (data: ExerciseEvent) => {
      console.log('長輩開始運動:', data);
      this.emit('exercise:start', data);
    });

    // 運動結束事件
    this.socket.on('exercise:end', (data: ExerciseEvent) => {
      console.log('長輩結束運動:', data);
      this.emit('exercise:end', data);
    });

    // 緊急求助已觸發確認
    this.socket.on('emergency:triggered', (data: any) => {
      console.log('緊急求助已發送:', data);
      this.emit('emergency:triggered', data);
    });

    // 緊急求助已取消確認
    this.socket.on('emergency:cancelled', (data: any) => {
      console.log('緊急求助已取消:', data);
      this.emit('emergency:cancelled', data);
    });

    // 子女確認收到緊急求助（長輩收到）
    this.socket.on('emergency:acknowledged', (data: any) => {
      console.log('子女已收到緊急求助:', data);
      this.emit('emergency:acknowledged', data);
    });
  }

  // 斷開連線
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('WebSocket 已斷開');
    }
  }

  // 檢查連線狀態
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // 加入長輩房間（子女監控用）
  joinElderRoom(elderId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join:elder', elderId);
      console.log(`加入長輩 ${elderId} 的房間`);
    }
  }

  // 離開長輩房間
  leaveElderRoom(elderId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave:elder', elderId);
      console.log(`離開長輩 ${elderId} 的房間`);
    }
  }

  // 發送自訂事件
  send(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket 未連線，無法發送事件');
    }
  }

  // 觸發緊急求助（長輩用）
  triggerEmergency(location?: { latitude: number; longitude: number }): void {
    if (this.socket?.connected) {
      this.socket.emit('emergency:trigger', { location });
      console.log('發送緊急求助');
    } else {
      console.warn('WebSocket 未連線，無法發送緊急求助');
    }
  }

  // 取消緊急求助（長輩用）
  cancelEmergency(): void {
    if (this.socket?.connected) {
      this.socket.emit('emergency:cancel');
      console.log('取消緊急求助');
    } else {
      console.warn('WebSocket 未連線，無法取消緊急求助');
    }
  }

  // 確認收到緊急求助（子女用）
  acknowledgeEmergency(elderId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('emergency:acknowledge', { elderId });
      console.log(`確認收到長輩 ${elderId} 的緊急求助`);
    } else {
      console.warn('WebSocket 未連線，無法確認緊急求助');
    }
  }

  // 監聽網路狀態變化
  setupNetworkListener(): void {
    NetworkService.on('connected', () => {
      if (!this.socket?.connected) {
        console.log('網路恢復，嘗試重新連線 WebSocket');
        this.connect();
      }
    });

    NetworkService.on('disconnected', () => {
      console.log('網路斷開，WebSocket 將自動嘗試重連');
    });
  }

  // 重新連線
  async reconnect(): Promise<void> {
    this.disconnect();
    await this.connect();
  }
}

// 匯出單例
export const WebSocketService = new WebSocketServiceClass();

export default WebSocketService;
