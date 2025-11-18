# 技術研究：長輩運動關懷應用程式

專案：001-elderly-fitness-app | 日期：2025-11-18

## 研究目標

本文檔記錄 Phase 0 技術研究的結果，針對長輩運動 app 的關鍵技術挑戰進行深入研究，為 Phase 1 架構設計提供技術依據。

## 研究領域

### 1. React Native 離線同步最佳實踐

#### 研究問題
- 如何在無網路環境下記錄運動數據？
- 網路恢復後如何自動同步？
- 如何處理資料衝突？

#### 研究結果

**推薦方案：AsyncStorage + SQLite + 同步佇列**

**本地儲存架構**：
```typescript
// 使用 SQLite 儲存結構化資料（運動記錄）
// 使用 AsyncStorage 儲存設定和快取
// 使用同步佇列管理待同步項目

interface SyncQueue {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'exercise' | 'reward' | 'achievement';
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
}
```

**同步策略**：
1. **樂觀 UI 更新**：本地立即顯示，背景同步
2. **操作佇列**：所有本地操作加入同步佇列
3. **自動重試**：網路恢復時自動處理佇列（指數退避）
4. **衝突解決**：採用「最後寫入優先」（Last Write Wins）+ 時間戳記
5. **優先級排序**：緊急求助 > 運動記錄 > 獎項兌換

**推薦套件**：
- `@react-native-async-storage/async-storage`：鍵值對儲存
- `react-native-sqlite-storage`：本地關聯式資料庫
- `@react-native-community/netinfo`：網路狀態監聽
- `redux-persist`：Redux 狀態持久化

**實作重點**：
```typescript
// 監聽網路狀態
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    syncService.processSyncQueue();
  }
});

// 同步服務
class SyncService {
  async processSyncQueue() {
    const queue = await this.getSyncQueue();
    const sortedQueue = this.sortByPriority(queue);

    for (const item of sortedQueue) {
      try {
        await this.syncItem(item);
        await this.markAsSynced(item.id);
      } catch (error) {
        await this.incrementRetryCount(item.id);
        if (item.retryCount > 3) {
          await this.markAsFailed(item.id);
          this.notifyUserOfSyncFailure(item);
        }
      }
    }
  }
}
```

**衝突處理規則**：
- 運動記錄：不會有衝突（只能從單一裝置新增）
- 點數餘額：伺服器為權威來源，客戶端顯示為參考
- 獎項兌換：需要伺服器端原子操作（樂觀鎖定）

---

### 2. Firebase Cloud Messaging (FCM) 推播通知配置

#### 研究問題
- 如何確保推播通知高送達率（≥95%）？
- 如何處理 iOS 和 Android 的差異？
- 如何實現高優先級緊急警報？

#### 研究結果

**FCM 配置策略**

**1. 推播通知類型設計**：

```typescript
// 通知優先級
enum NotificationPriority {
  LOW = 'low',           // 一般資訊（獎項提醒）
  DEFAULT = 'default',   // 標準通知（運動開始）
  HIGH = 'high'          // 緊急警報（求助、未開啟 app）
}

// 通知類型
interface PushNotification {
  priority: NotificationPriority;
  title: string;
  body: string;
  data: {
    type: 'exercise_start' | 'inactivity_alert' | 'emergency' | 'reward';
    elderId: string;
    timestamp: number;
    location?: { lat: number; lng: number };
  };
  // Android 特定
  android: {
    channelId: string;
    sound: string;
    vibrate: number[];
  };
  // iOS 特定
  apns: {
    sound: string;
    badge: number;
    category: string;
  };
}
```

**2. Android 通知頻道配置**：

```kotlin
// android/app/src/main/.../MainApplication.kt
// 建立多個通知頻道
val channels = listOf(
  NotificationChannel(
    "exercise_updates",
    "運動更新",
    NotificationManager.IMPORTANCE_DEFAULT
  ),
  NotificationChannel(
    "emergency_alerts",
    "緊急警報",
    NotificationManager.IMPORTANCE_HIGH
  ).apply {
    enableVibration(true)
    vibrationPattern = longArrayOf(0, 500, 200, 500)
    setSound(Uri.parse("android.resource://..."))
  },
  NotificationChannel(
    "inactivity_reminders",
    "活躍提醒",
    NotificationManager.IMPORTANCE_HIGH
  )
)
```

**3. iOS 推播設定**：

```swift
// ios/AppDelegate.swift
// 請求通知權限
UNUserNotificationCenter.current().requestAuthorization(
  options: [.alert, .badge, .sound, .criticalAlert]
) { granted, error in
  // 處理授權結果
}

// 註冊通知類別（支援快速操作）
let emergencyCategory = UNNotificationCategory(
  identifier: "EMERGENCY",
  actions: [
    UNNotificationAction(
      identifier: "CALL",
      title: "立即撥打電話",
      options: [.foreground]
    )
  ],
  intentIdentifiers: []
)
```

**4. 提升送達率策略**：

| 策略 | 說明 | 預期效果 |
|------|------|---------|
| **Token 管理** | 定期更新 FCM Token（每次 app 啟動檢查） | +5% |
| **多重備援** | FCM 失敗時啟用 APNs（iOS）或本地通知 | +3% |
| **靜默推播** | 定期發送靜默推播保持連線活躍 | +2% |
| **重試機制** | 發送失敗後 30 秒、5 分鐘、1 小時重試 | +5% |
| **背景限制處理** | Android 省電模式引導用戶加入白名單 | +10% |

**5. 推播通知最佳實踐**：

```typescript
// 後端發送邏輯
class NotificationService {
  async sendNotification(userIds: string[], notification: PushNotification) {
    const tokens = await this.getDeviceTokens(userIds);

    // 批次發送（FCM 限制 500 個 token/request）
    const batches = this.chunkArray(tokens, 500);

    const results = await Promise.allSettled(
      batches.map(batch =>
        admin.messaging().sendMulticast({
          tokens: batch,
          ...notification,
          // 重要：設定 TTL
          android: {
            ...notification.android,
            ttl: 3600 * 24 * 1000, // 24 小時
          },
          apns: {
            ...notification.apns,
            payload: {
              aps: {
                contentAvailable: true,
                expirationDate: Date.now() + 3600 * 24,
              }
            }
          }
        })
      )
    );

    // 處理失效 token
    await this.removeInvalidTokens(results);

    // 記錄送達率
    await this.logDeliveryMetrics(results);
  }
}
```

**6. 緊急警報特殊處理**：

```typescript
// 緊急警報使用最高優先級
async sendEmergencyAlert(childIds: string[], elderInfo: Elder, location?: Location) {
  // 1. FCM 高優先級推播
  await this.sendNotification(childIds, {
    priority: NotificationPriority.HIGH,
    title: '🚨 緊急求助',
    body: `${elderInfo.name} 觸發了緊急求助！`,
    data: {
      type: 'emergency',
      elderId: elderInfo.id,
      timestamp: Date.now(),
      location,
    },
    android: {
      channelId: 'emergency_alerts',
      sound: 'emergency_sound',
      vibrate: [0, 500, 200, 500, 200, 500],
    }
  });

  // 2. WebSocket 即時推送（如果子女在線）
  await this.websocketService.emitToUsers(childIds, 'emergency', {
    elder: elderInfo,
    location,
  });

  // 3. 記錄到資料庫（備援查詢）
  await this.db.notification.create({
    type: 'emergency',
    elderid: elderInfo.id,
    recipientIds: childIds,
    timestamp: new Date(),
  });
}
```

**推薦套件**：
- `@react-native-firebase/messaging`：FCM 整合
- `@react-native-firebase/app`：Firebase 核心
- `react-native-push-notification`：本地通知（備援）

---

### 3. 語音錄製與壓縮方案

#### 研究問題
- 如何錄製高品質語音（清晰可聽）？
- 如何壓縮語音檔案至 < 5MB？
- 如何確保跨平台播放相容性？

#### 研究結果

**推薦方案：AAC 格式 + 16kHz 取樣率**

**1. 語音格式比較**：

| 格式 | 壓縮率 | 音質 | 檔案大小（30秒） | 相容性 | 推薦 |
|------|-------|------|----------------|--------|------|
| WAV | 無 | 極佳 | ~5MB | ✅ 高 | ❌ 太大 |
| MP3 | 高 | 良好 | ~480KB | ✅ 高 | ✔️ 可用 |
| AAC | 極高 | 優秀 | ~360KB | ✅ 高 | ✅ 最佳 |
| OPUS | 極高 | 優秀 | ~300KB | ⚠️ 中 | ⚠️ iOS 需額外處理 |

**選擇 AAC 的原因**：
- 壓縮率高於 MP3（相同音質檔案更小）
- iOS 和 Android 原生支援
- 適合語音編碼（人聲優化）

**2. 錄音參數配置**：

```typescript
// React Native Voice 配置
import Voice from '@react-native-voice/voice';

const recordingOptions = {
  // 音訊格式
  audioEncoding: 'aac',           // AAC 格式

  // 取樣率（語音 16kHz 足夠，音樂需 44.1kHz）
  sampleRate: 16000,              // 16kHz

  // 位元率（語音 32-64kbps 足夠）
  bitRate: 48000,                 // 48kbps

  // 聲道數
  channels: 1,                    // 單聲道（語音不需立體聲）

  // 錄音品質
  audioQuality: 'high',

  // 最大時長限制
  maxDuration: 30000,             // 30 秒
};

// 計算檔案大小：
// 48kbps * 30秒 = 1440kb = 180KB ✅ 遠小於 5MB 限制
```

**3. 錄音實作**：

```typescript
class VoiceRecordingService {
  private recordingPath: string = '';

  async startRecording(): Promise<void> {
    // 檢查麥克風權限
    const hasPermission = await this.requestMicrophonePermission();
    if (!hasPermission) {
      throw new Error('需要麥克風權限');
    }

    // 開始錄音
    this.recordingPath = await Voice.start({
      ...recordingOptions,
      // 儲存路徑
      path: `${RNFS.DocumentDirectoryPath}/voice_${Date.now()}.aac`
    });

    // 監聽錄音事件
    Voice.onSpeechResults = this.handleSpeechResults;
    Voice.onSpeechError = this.handleError;
  }

  async stopRecording(): Promise<RecordedAudio> {
    await Voice.stop();

    // 取得錄音檔案資訊
    const fileInfo = await RNFS.stat(this.recordingPath);

    // 驗證檔案大小
    if (fileInfo.size > 5 * 1024 * 1024) {
      throw new Error('語音檔案超過 5MB 限制');
    }

    return {
      path: this.recordingPath,
      duration: await this.getAudioDuration(this.recordingPath),
      size: fileInfo.size,
      format: 'aac',
    };
  }

  async getAudioDuration(path: string): Promise<number> {
    // 使用 react-native-sound 取得時長
    const sound = new Sound(path, '', (error) => {
      if (error) throw error;
    });
    return sound.getDuration();
  }
}
```

**4. 語音壓縮（如果需要進一步縮小）**：

```typescript
import { AudioUtils } from 'react-native-audio-toolkit';

async compressAudio(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace('.aac', '_compressed.aac');

  await AudioUtils.compress({
    inputPath,
    outputPath,
    bitRate: 32000,        // 降至 32kbps（語音仍清晰）
    sampleRate: 16000,     // 維持 16kHz
    channels: 1,           // 單聲道
  });

  return outputPath;
}
```

**5. 語音播放實作**：

```typescript
import Sound from 'react-native-sound';

class VoicePlaybackService {
  private sound: Sound | null = null;

  async playVoice(url: string): Promise<void> {
    // 釋放舊的音訊資源
    if (this.sound) {
      this.sound.release();
    }

    // 載入音訊
    this.sound = new Sound(url, '', (error) => {
      if (error) {
        console.error('載入失敗', error);
        return;
      }

      // 播放
      this.sound.play((success) => {
        if (!success) {
          console.error('播放失敗');
        }
      });
    });
  }

  pause(): void {
    this.sound?.pause();
  }

  resume(): void {
    this.sound?.play();
  }

  stop(): void {
    this.sound?.stop();
    this.sound?.release();
    this.sound = null;
  }

  setVolume(volume: number): void {
    // 0.0 - 1.0
    this.sound?.setVolume(volume);
  }
}
```

**6. 運動時語音播放策略**：

```typescript
class ExerciseVoiceScheduler {
  private playbackInterval: NodeJS.Timeout | null = null;
  private voiceMessages: VoiceMessage[] = [];

  async startScheduledPlayback(elderid: string) {
    // 載入子女語音列表
    this.voiceMessages = await this.fetchVoiceMessages(elderId);

    if (this.voiceMessages.length === 0) {
      // 播放系統預設鼓勵語音
      await this.playDefaultVoice();
      return;
    }

    // 每 5 分鐘播放一次
    this.playbackInterval = setInterval(async () => {
      const randomVoice = this.getRandomVoice();
      await voicePlaybackService.playVoice(randomVoice.url);

      // 記錄播放次數
      await this.incrementPlayCount(randomVoice.id);
    }, 5 * 60 * 1000); // 5 分鐘
  }

  stopScheduledPlayback(): void {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    voicePlaybackService.stop();
  }

  private getRandomVoice(): VoiceMessage {
    return this.voiceMessages[
      Math.floor(Math.random() * this.voiceMessages.length)
    ];
  }
}
```

**推薦套件**：
- `@react-native-voice/voice`：語音錄製
- `react-native-sound`：語音播放
- `react-native-fs`：檔案系統操作
- `react-native-audio-recorder-player`：備選方案（錄製+播放一體）

---

### 4. WebSocket 即時通訊（緊急求助）

#### 研究問題
- 如何確保緊急警報在 10 秒內送達？
- WebSocket 連線斷線如何處理？
- 如何與 FCM 推播配合？

#### 研究結果

**雙重通道策略：WebSocket（即時） + FCM（備援）**

**1. WebSocket 架構**：

```typescript
// 後端：Socket.io 伺服器
import { Server } from 'socket.io';

class WebSocketServer {
  private io: Server;
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: { origin: '*' },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.on('connection', (socket) => {
      // 驗證 JWT
      const userId = this.authenticateSocket(socket);

      // 儲存用戶 socket 映射
      this.addUserSocket(userId, socket.id);

      // 監聽緊急求助
      socket.on('emergency', (data) => {
        this.handleEmergency(userId, data);
      });

      // 處理斷線
      socket.on('disconnect', () => {
        this.removeUserSocket(userId, socket.id);
      });
    });
  }

  async handleEmergency(elderId: string, data: EmergencyData) {
    // 取得綁定的子女
    const childIds = await this.getBindingChildren(elderId);

    // 即時推送給在線的子女
    const onlineChildren = this.getOnlineUsers(childIds);
    onlineChildren.forEach(childId => {
      const socketIds = this.userSockets.get(childId) || [];
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit('emergency_alert', {
          elder: data.elder,
          location: data.location,
          timestamp: Date.now(),
        });
      });
    });

    // FCM 推播給所有子女（包含離線的）
    await notificationService.sendEmergencyAlert(childIds, data.elder, data.location);
  }

  emitToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId) || [];
    socketIds.forEach(socketId => {
      this.io.to(socketId).emit(event, data);
    });
  }
}
```

**2. 客戶端：Socket.io Client**：

```typescript
// mobile/src/services/websocket.service.ts
import io, { Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    this.socket = io(Config.WEBSOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.socket?.on('connect', () => {
      console.log('WebSocket 已連線');
      this.reconnectAttempts = 0;
      store.dispatch(setWebSocketStatus('connected'));
    });

    this.socket?.on('disconnect', () => {
      console.log('WebSocket 已斷線');
      store.dispatch(setWebSocketStatus('disconnected'));
    });

    this.socket?.on('reconnect_attempt', () => {
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        // 降級使用輪詢 + FCM
        this.fallbackToPolling();
      }
    });

    // 監聽緊急警報
    this.socket?.on('emergency_alert', (data) => {
      this.handleEmergencyAlert(data);
    });

    // 監聽運動開始通知
    this.socket?.on('exercise_start', (data) => {
      this.handleExerciseStart(data);
    });
  }

  sendEmergency(location?: Location) {
    this.socket?.emit('emergency', {
      elder: store.getState().auth.user,
      location,
      timestamp: Date.now(),
    });
  }

  private handleEmergencyAlert(data: EmergencyAlertData) {
    // 顯示高優先級通知
    LocalNotification.showEmergency({
      title: '🚨 緊急求助',
      body: `${data.elder.name} 觸發了緊急求助！`,
      data,
    });

    // 震動
    Vibration.vibrate([0, 500, 200, 500, 200, 500]);

    // 播放警報聲
    SoundPlayer.play('emergency_alert.mp3');

    // 更新 Redux 狀態
    store.dispatch(addEmergencyAlert(data));
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export default new WebSocketService();
```

**3. 緊急求助完整流程**：

```
長輩端觸發緊急求助
    ↓
[1] WebSocket 即時發送 (目標 < 5 秒)
    ↓
[2] 同時觸發 FCM 推播 (備援，< 10 秒)
    ↓
[3] 寫入資料庫（持久化記錄）
    ↓
子女端接收（三種方式之一）：
    - WebSocket 即時推送（在線用戶）✅ 最快
    - FCM 推播（背景/離線用戶）✅ 備援
    - 定期輪詢（極端情況）✅ 保底
```

**4. 延遲優化策略**：

| 策略 | 延遲改善 | 實作複雜度 |
|------|---------|-----------|
| 使用 WebSocket | -5 秒 | 中 |
| 區域化部署（就近伺服器） | -2 秒 | 高 |
| HTTP/2 | -1 秒 | 低 |
| FCM 高優先級 | -2 秒 | 低 |
| 預建立連線（keep-alive） | -1 秒 | 中 |

**推薦套件**：
- `socket.io-client`：WebSocket 客戶端
- `socket.io`：後端 WebSocket 伺服器

---

### 5. 長輩友善 UI/UX 設計模式

#### 研究問題
- 如何設計適合長輩使用的介面？
- 字體、顏色、按鈕大小的最佳實踐？
- 如何減少操作步驟？

#### 研究結果

**設計原則：大、清晰、簡單**

**1. 視覺設計規範**：

```typescript
// 設計 Token
export const ElderlyDesignTokens = {
  // 字體大小（比一般 app 大 1.5-2 倍）
  fontSize: {
    small: 18,      // 一般 app 的 12
    medium: 22,     // 一般 app 的 14
    large: 28,      // 一般 app 的 18
    xlarge: 36,     // 標題
    xxlarge: 48,    // 重要數字
  },

  // 行高（增加可讀性）
  lineHeight: {
    small: 26,
    medium: 32,
    large: 40,
  },

  // 字重（加粗更清晰）
  fontWeight: {
    regular: '500',  // 比一般 400 更粗
    medium: '600',
    bold: '700',
  },

  // 顏色（高對比度）
  colors: {
    // 主色（避免紅綠色盲問題）
    primary: '#2563EB',      // 藍色（清晰）
    success: '#059669',      // 綠色（深色易辨識）
    warning: '#D97706',      // 橘色（警告）
    danger: '#DC2626',       // 紅色（緊急）

    // 文字顏色（高對比）
    text: {
      primary: '#111827',    // 接近黑色
      secondary: '#4B5563',  // 深灰
      tertiary: '#6B7280',   // 中灰
    },

    // 背景顏色
    background: {
      primary: '#FFFFFF',    // 純白
      secondary: '#F9FAFB',  // 淺灰
    },
  },

  // 間距（增大觸控區域）
  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },

  // 圓角（柔和視覺）
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    full: 9999,
  },

  // 觸控目標最小尺寸
  touchTarget: {
    minHeight: 56,    // 至少 56dp (iOS 44pt, Android 48dp)
    minWidth: 56,
  },
};
```

**2. 關鍵元件設計**：

```typescript
// 大按鈕元件
const ElderlyButton: React.FC<Props> = ({ title, onPress, type = 'primary' }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        minHeight: 72,           // 超大觸控區域
        paddingHorizontal: 32,
        paddingVertical: 20,
        backgroundColor: type === 'primary' ? '#2563EB' : '#059669',
        borderRadius: 16,
        // 陰影增加立體感
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
      }}
      activeOpacity={0.8}        // 明顯的按下回饋
    >
      <Text style={{
        fontSize: 28,            // 大字體
        fontWeight: '700',       // 粗體
        color: '#FFFFFF',
        textAlign: 'center',
      }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// 運動開始/結束按鈕（首頁核心元件）
const ExerciseToggleButton: React.FC = ({ isExercising, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: isExercising ? '#DC2626' : '#059669',
        justifyContent: 'center',
        alignItems: 'center',
        // 強陰影
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 16,
      }}
    >
      <Icon
        name={isExercising ? 'stop' : 'play'}
        size={80}
        color="#FFFFFF"
      />
      <Text style={{
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 16,
      }}>
        {isExercising ? '結束運動' : '開始運動'}
      </Text>
    </TouchableOpacity>
  );
};
```

**3. 頁面佈局原則**：

```typescript
// 長輩端首頁範例
const ElderHomeScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* 頂部狀態列 - 大字體顯示關鍵資訊 */}
      <View style={{ padding: 24, backgroundColor: '#F9FAFB' }}>
        <Text style={{ fontSize: 20, color: '#6B7280' }}>今日運動</Text>
        <Text style={{ fontSize: 48, fontWeight: '700', color: '#111827' }}>
          0 分鐘
        </Text>
      </View>

      {/* 中央大按鈕 - 一鍵開始運動 */}
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
      }}>
        <ExerciseToggleButton
          isExercising={false}
          onPress={handleStartExercise}
        />
      </View>

      {/* 底部次要功能 - 大圖示 + 文字 */}
      <View style={{
        flexDirection: 'row',
        padding: 24,
        gap: 16,
      }}>
        <IconButton
          icon="history"
          label="運動記錄"
          onPress={() => navigation.navigate('History')}
        />
        <IconButton
          icon="gift"
          label="我的獎品"
          onPress={() => navigation.navigate('Rewards')}
        />
        <IconButton
          icon="person"
          label="個人資料"
          onPress={() => navigation.navigate('Profile')}
        />
      </View>
    </SafeAreaView>
  );
};
```

**4. 操作流程簡化**：

**不良範例**（4 步）：
```
1. 開啟 app
2. 點擊「運動」標籤
3. 選擇運動類型
4. 點擊「開始」按鈕
```

**優化範例**（2 步）：
```
1. 開啟 app（直接顯示開始按鈕）
2. 點擊中央大按鈕「開始運動」
   （運動類型自動記錄為「一般運動」，可事後修改）
```

**5. 輔助功能**：

```typescript
// 語音提示（Text-to-Speech）
import Tts from 'react-native-tts';

class VoiceAssistant {
  async speak(text: string) {
    await Tts.setDefaultLanguage('zh-TW');  // 繁體中文
    await Tts.setDefaultRate(0.5);          // 放慢速度
    await Tts.speak(text);
  }

  // 操作提示
  async guideUserToStartExercise() {
    await this.speak('請點擊中間的綠色按鈕開始運動');
  }

  async confirmExerciseStarted() {
    await this.speak('運動已開始，加油！');
  }
}

// 震動回饋
import { Vibration } from 'react-native';

const provideHapticFeedback = () => {
  Vibration.vibrate(50);  // 短震動確認操作
};

// 所有按鈕加上震動回饋
<TouchableOpacity
  onPress={() => {
    provideHapticFeedback();
    handlePress();
  }}
>
  ...
</TouchableOpacity>
```

**6. 錯誤處理與引導**：

```typescript
// 友善的錯誤訊息
const ErrorMessage = ({ message }: { message: string }) => {
  return (
    <View style={{
      padding: 24,
      backgroundColor: '#FEE2E2',
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#DC2626',
    }}>
      <Text style={{ fontSize: 22, fontWeight: '600', color: '#991B1B' }}>
        ⚠️ 操作失敗
      </Text>
      <Text style={{ fontSize: 18, color: '#991B1B', marginTop: 8 }}>
        {message}
      </Text>
      {/* 提供明確的解決方案 */}
      <Text style={{ fontSize: 18, color: '#991B1B', marginTop: 12 }}>
        請稍後再試，或聯絡子女協助
      </Text>
    </View>
  );
};
```

**推薦套件**：
- `react-native-tts`：文字轉語音
- `react-native-vector-icons`：圖示庫
- `react-native-haptic-feedback`：震動回饋

---

## 研究總結

### 技術選型確認

| 技術需求 | 選定方案 | 理由 |
|---------|---------|------|
| 離線同步 | AsyncStorage + SQLite + 同步佇列 | 可靠、成熟、React Native 原生支援 |
| 推播通知 | Firebase FCM | 高送達率、跨平台、免費額度足夠 |
| 語音格式 | AAC (16kHz, 48kbps, 單聲道) | 壓縮率高、音質好、相容性佳 |
| 即時通訊 | Socket.io + FCM 雙重通道 | 低延遲、高可靠性 |
| UI/UX | 大字體 + 高對比 + 簡化流程 | 長輩友善、易用性高 |

### 關鍵風險緩解

1. **推播送達率**：FCM + 重試機制 + 本地通知備援 → 預期達成 95%+
2. **緊急警報延遲**：WebSocket + FCM 雙通道 → 預期 < 10 秒
3. **離線資料衝突**：時間戳記 + LWW 策略 → 衝突率 < 0.1%
4. **語音檔案過大**：AAC 壓縮 + 參數優化 → 30 秒約 180KB
5. **長輩使用障礙**：大按鈕 + 語音提示 + 簡化流程 → 降低學習成本

### 待 Phase 1 設計

- 資料庫 schema 詳細設計（data-model.md）
- RESTful API 合約規範（contracts/）
- 開發環境快速啟動指南（quickstart.md）
- 重新執行憲章合規性檢查

### 參考資料

- [React Native 官方文檔](https://reactnative.dev/)
- [Firebase Cloud Messaging 文檔](https://firebase.google.com/docs/cloud-messaging)
- [Socket.io 官方文檔](https://socket.io/docs/v4/)
- [AAC 音訊編碼規範](https://en.wikipedia.org/wiki/Advanced_Audio_Coding)
- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Accessibility](https://material.io/design/usability/accessibility.html)
