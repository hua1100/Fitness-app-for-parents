# API 合約：語音激勵管理

專案：001-elderly-fitness-app | 版本：v1 | 日期：2025-11-18

## 基本資訊

**Base URL**：`https://api.fitness-app.com/v1`

**認證**：所有端點需要 JWT Bearer Token

---

## 端點列表

### 1. 上傳語音訊息

子女上傳錄製的鼓勵語音。

**端點**：`POST /voice`

**權限**：僅限子女角色（CHILD）

**請求標頭**：
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**請求主體**（FormData）：
```
elderId: string     // 長輩 ID
voice: File         // 語音檔案（AAC/MP3，最長 30 秒，最大 5MB）
```

**回應**：`201 Created`
```typescript
interface UploadVoiceResponse {
  success: true;
  data: {
    voiceMessage: {
      id: string;
      elderId: string;
      childId: string;
      childName: string;
      fileUrl: string;        // S3 CDN URL
      fileName: string;
      fileSize: number;       // bytes
      duration: number;       // 秒數
      format: 'aac' | 'mp3';
      playCount: 0;
      createdAt: string;
    };
    quota: {
      current: number;        // 當前語音數量
      limit: 20;              // 上限
      remaining: number;      // 剩餘可上傳數量
    };
  };
}
```

**驗證規則**：
- 檔案格式：AAC 或 MP3
- 檔案大小：最大 5MB
- 語音時長：最長 30 秒
- 數量限制：每對綁定關係最多 20 段

**副作用**：
- 上傳檔案到 AWS S3
- 提取音訊時長（使用 FFmpeg 或類似工具）
- 發送通知給長輩「子女為您錄製了新的鼓勵語音」

**錯誤回應**：

`400 Bad Request` - 檔案格式不支援
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_FORMAT",
    "message": "僅支援 AAC 和 MP3 格式的語音檔案"
  }
}
```

`400 Bad Request` - 檔案過大
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "語音檔案超過 5MB 限制，目前大小：7.2MB"
  }
}
```

`400 Bad Request` - 時長超限
```json
{
  "success": false,
  "error": {
    "code": "DURATION_TOO_LONG",
    "message": "語音時長超過 30 秒限制，目前時長：45 秒"
  }
}
```

`400 Bad Request` - 已達數量上限
```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "已達語音數量上限（20 段），請刪除部分語音後再上傳"
  }
}
```

`403 Forbidden` - 未綁定該長輩
```json
{
  "success": false,
  "error": {
    "code": "NOT_BOUND_TO_ELDER",
    "message": "您未與此長輩綁定"
  }
}
```

---

### 2. 取得語音列表

查詢語音訊息列表。

**端點**：`GET /voice`

**權限**：
- 子女：查詢自己為特定長輩錄製的語音（需提供 `elderId`）
- 長輩：查詢子女為自己錄製的所有語音

**查詢參數**：
```typescript
interface GetVoicesQuery {
  elderId?: string;         // 長輩 ID（子女查詢時必填）
  childId?: string;         // 子女 ID（長輩可篩選特定子女的語音）
  sortBy?: 'createdAt' | 'playCount' | 'duration';
  order?: 'asc' | 'desc';   // 預設 desc
  page?: number;
  limit?: number;
}
```

**回應**：`200 OK`
```typescript
interface GetVoicesResponse {
  success: true;
  data: {
    voices: Array<{
      id: string;
      elder: {
        id: string;
        name: string;
      };
      child: {
        id: string;
        name: string;
        avatar: string;
      };
      fileUrl: string;
      fileName: string;
      fileSize: number;
      duration: number;
      format: 'aac' | 'mp3';
      playCount: number;
      lastPlayedAt: string | null;
      createdAt: string;
    }>;
    stats: {
      totalVoices: number;
      totalDuration: number;     // 總時長（秒）
      mostPlayed: {              // 播放最多的語音
        id: string;
        playCount: number;
      } | null;
      quota: {
        current: number;
        limit: 20;
        remaining: number;
      };
    };
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
}
```

---

### 3. 取得單一語音詳情

查詢特定語音訊息的詳細資訊。

**端點**：`GET /voice/:voiceId`

**權限**：
- 子女：自己錄製的語音
- 長輩：為自己錄製的語音

**回應**：`200 OK`
```typescript
interface GetVoiceDetailResponse {
  success: true;
  data: {
    id: string;
    elder: {
      id: string;
      name: string;
      avatar: string;
    };
    child: {
      id: string;
      name: string;
      avatar: string;
    };
    fileUrl: string;           // S3 CDN URL（已簽章，1 小時有效）
    fileName: string;
    fileSize: number;
    duration: number;
    format: 'aac' | 'mp3';
    playCount: number;
    lastPlayedAt: string | null;
    // 播放歷史（最近 10 次）
    recentPlays: Array<{
      playedAt: string;
    }>;
    createdAt: string;
  };
}
```

---

### 4. 記錄語音播放

記錄語音播放次數（用於統計）。

**端點**：`POST /voice/:voiceId/play`

**權限**：
- 長輩：為自己錄製的語音
- 子女：可以預覽自己錄製的語音

**請求主體**：
```typescript
interface PlayVoiceRequest {
  // 無需額外參數
}
```

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "playCount": 15,
    "lastPlayedAt": "2025-11-18T10:30:00Z"
  }
}
```

**副作用**：
- 增加 `playCount`
- 更新 `lastPlayedAt`

---

### 5. 刪除語音訊息

刪除語音訊息（軟刪除）。

**端點**：`DELETE /voice/:voiceId`

**權限**：僅限語音創建者（子女）

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "message": "語音已刪除"
  }
}
```

**副作用**：
- 標記為軟刪除（`deletedAt`）
- 從 S3 移除檔案（或標記為過期）
- 更新語音配額（剩餘數量 +1）

---

### 6. 取得語音配額資訊

查詢當前語音數量配額。

**端點**：`GET /voice/quota`

**權限**：僅限子女角色（CHILD）

**查詢參數**：
```typescript
interface GetQuotaQuery {
  elderId: string;  // 長輩 ID
}
```

**回應**：`200 OK`
```typescript
interface GetQuotaResponse {
  success: true;
  data: {
    elderId: string;
    elderName: string;
    quota: {
      current: number;        // 當前語音數量
      limit: 20;              // 上限
      remaining: number;      // 剩餘可上傳數量
    };
    totalDuration: number;    // 總時長（秒）
    totalSize: number;        // 總檔案大小（bytes）
  };
}
```

---

### 7. 批次刪除語音

一次刪除多段語音。

**端點**：`POST /voice/batch-delete`

**權限**：僅限子女角色（CHILD）

**請求主體**：
```typescript
interface BatchDeleteVoicesRequest {
  voiceIds: string[];   // 語音 ID 陣列
}
```

**範例請求**：
```json
{
  "voiceIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "deletedCount": 3,
    "message": "已刪除 3 段語音"
  }
}
```

---

### 8. 取得隨機語音（運動時播放）

取得隨機一段語音用於播放（長輩運動時使用）。

**端點**：`GET /voice/random`

**權限**：僅限長輩角色（ELDER）

**查詢參數**：
```typescript
interface GetRandomVoiceQuery {
  excludeIds?: string[];    // 排除的語音 ID（避免重複播放）
}
```

**回應**：`200 OK`

有可用語音：
```typescript
interface GetRandomVoiceResponse {
  success: true;
  data: {
    voice: {
      id: string;
      child: {
        id: string;
        name: string;
        avatar: string;
      };
      fileUrl: string;        // 預簽章 URL
      duration: number;
      createdAt: string;
    };
  };
}
```

無可用語音：
```json
{
  "success": true,
  "data": {
    "voice": null,
    "message": "尚無子女錄製的語音，將播放系統預設鼓勵語音"
  }
}
```

**副作用**：
- 自動呼叫 `POST /voice/:voiceId/play` 記錄播放

---

### 9. 取得系統預設語音

取得系統預設的鼓勵語音列表（當子女未錄製時使用）。

**端點**：`GET /voice/default`

**權限**：所有已登入用戶

**回應**：`200 OK`
```typescript
interface GetDefaultVoicesResponse {
  success: true;
  data: {
    defaultVoices: Array<{
      id: string;
      title: string;
      description: string;
      fileUrl: string;
      duration: number;
      language: 'zh-TW';
      gender: 'male' | 'female';
      tone: 'encouraging' | 'cheerful' | 'calm';
    }>;
  };
}
```

**預設語音範例**：
- 「加油！您做得很棒！」
- 「繼續努力，健康就是財富！」
- 「今天的運動很充實呢！」
- 「運動讓您更有活力！」

---

### 10. 預覽語音（上傳前）

取得預簽章 S3 URL 用於直接上傳（前端直傳 S3）。

**端點**：`POST /voice/presigned-url`

**權限**：僅限子女角色（CHILD）

**請求主體**：
```typescript
interface GetPresignedUrlRequest {
  elderId: string;
  fileName: string;
  fileType: 'audio/aac' | 'audio/mpeg';
  fileSize: number;       // bytes
}
```

**回應**：`200 OK`
```typescript
interface GetPresignedUrlResponse {
  success: true;
  data: {
    uploadUrl: string;      // S3 預簽章上傳 URL
    fileUrl: string;        // 上傳後的檔案 URL
    fields: {               // 額外的表單欄位
      key: string;
      bucket: string;
      'X-Amz-Algorithm': string;
      'X-Amz-Credential': string;
      'X-Amz-Date': string;
      Policy: string;
      'X-Amz-Signature': string;
    };
    expiresAt: string;      // URL 過期時間（15 分鐘）
  };
}
```

**使用流程**：
1. 客戶端呼叫此 API 取得上傳 URL
2. 客戶端直接上傳檔案到 S3
3. 上傳完成後呼叫 `POST /voice` 建立語音記錄

---

## 錯誤代碼總覽

| 錯誤代碼 | HTTP 狀態碼 | 說明 |
|---------|-----------|------|
| `VOICE_NOT_FOUND` | 404 | 語音訊息不存在 |
| `INVALID_FILE_FORMAT` | 400 | 不支援的檔案格式 |
| `FILE_TOO_LARGE` | 400 | 檔案超過 5MB 限制 |
| `DURATION_TOO_LONG` | 400 | 語音時長超過 30 秒 |
| `QUOTA_EXCEEDED` | 400 | 已達語音數量上限（20 段） |
| `NOT_BOUND_TO_ELDER` | 403 | 未綁定該長輩 |
| `FORBIDDEN` | 403 | 無權操作此語音 |
| `UPLOAD_FAILED` | 500 | S3 上傳失敗 |

---

## S3 檔案命名規範

```
voices/
  {childId}/
    {elderId}/
      {timestamp}_{uuid}.aac
```

**範例**：
```
voices/123e4567-e89b-12d3-a456-426614174000/456e7890-e89b-12d3-a456-426614174001/1700301234567_abc123.aac
```

**CDN URL**：
```
https://cdn.fitness-app.com/voices/123e4567.../1700301234567_abc123.aac
```

---

## 範例程式碼（客戶端）

```typescript
// 錄製並上傳語音
async function recordAndUploadVoice(elderId: string) {
  // 1. 開始錄音
  await VoiceRecorder.requestPermission();
  const recording = await VoiceRecorder.start({
    maxDuration: 30000,  // 30 秒
    format: 'aac',
  });

  // 2. 停止錄音
  const audioFile = await VoiceRecorder.stop();

  // 3. 上傳語音
  const formData = new FormData();
  formData.append('elderId', elderId);
  formData.append('voice', {
    uri: audioFile.path,
    type: 'audio/aac',
    name: 'voice.aac',
  });

  const response = await fetchWithAuth('/voice', {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const result = await response.json();

  if (result.success) {
    showSuccessMessage('語音上傳成功！');
    return result.data.voiceMessage;
  } else {
    showErrorMessage(result.error.message);
  }
}

// 查詢語音列表
async function getVoiceList(elderId: string) {
  const response = await fetchWithAuth(
    `/voice?elderId=${elderId}&sortBy=createdAt&order=desc`
  );
  const result = await response.json();
  return result.data;
}

// 播放語音
async function playVoice(voiceId: string, fileUrl: string) {
  // 1. 播放音訊
  await AudioPlayer.play(fileUrl);

  // 2. 記錄播放次數
  await fetchWithAuth(`/voice/${voiceId}/play`, {
    method: 'POST',
  });
}

// 刪除語音
async function deleteVoice(voiceId: string) {
  const confirmed = await showConfirmDialog('確定要刪除此語音嗎？');

  if (confirmed) {
    const response = await fetchWithAuth(`/voice/${voiceId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      showSuccessMessage('語音已刪除');
      refreshVoiceList();
    }
  }
}

// 運動時隨機播放語音
async function playRandomVoiceDuringExercise() {
  const response = await fetchWithAuth('/voice/random');
  const result = await response.json();

  if (result.data.voice) {
    // 播放子女語音
    await AudioPlayer.play(result.data.voice.fileUrl);
    showMessage(`正在播放 ${result.data.voice.child.name} 的鼓勵語音`);
  } else {
    // 播放系統預設語音
    const defaultVoices = await getDefaultVoices();
    const randomVoice = defaultVoices[Math.floor(Math.random() * defaultVoices.length)];
    await AudioPlayer.play(randomVoice.fileUrl);
  }
}

// 運動語音播放排程器
class ExerciseVoiceScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private playedVoiceIds: string[] = [];

  start() {
    // 每 5 分鐘播放一次
    this.intervalId = setInterval(async () => {
      await this.playNextVoice();
    }, 5 * 60 * 1000);

    // 立即播放第一次
    this.playNextVoice();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    AudioPlayer.stop();
  }

  async playNextVoice() {
    const response = await fetchWithAuth(
      `/voice/random?excludeIds=${this.playedVoiceIds.join(',')}`
    );
    const result = await response.json();

    if (result.data.voice) {
      await AudioPlayer.play(result.data.voice.fileUrl);
      this.playedVoiceIds.push(result.data.voice.id);

      // 避免陣列過大，只保留最近 10 個
      if (this.playedVoiceIds.length > 10) {
        this.playedVoiceIds.shift();
      }
    }
  }
}

// 使用範例
const scheduler = new ExerciseVoiceScheduler();

// 開始運動時啟動
onExerciseStart(() => {
  scheduler.start();
});

// 結束運動時停止
onExerciseEnd(() => {
  scheduler.stop();
});
```

---

## 音訊處理最佳實踐

### 1. 錄音參數

```typescript
const recordingConfig = {
  sampleRate: 16000,        // 16kHz（語音足夠）
  channels: 1,              // 單聲道
  bitRate: 48000,           // 48kbps
  format: 'aac',            // AAC 格式
  maxDuration: 30000,       // 30 秒限制
  audioQuality: 'high',
};
```

### 2. 壓縮策略

如果錄製的檔案過大，可在客戶端壓縮：

```typescript
import { AudioUtils } from 'react-native-audio-toolkit';

async function compressAudio(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace('.aac', '_compressed.aac');

  await AudioUtils.compress({
    inputPath,
    outputPath,
    bitRate: 32000,        // 降至 32kbps
    sampleRate: 16000,
  });

  return outputPath;
}
```

### 3. 播放優化

```typescript
// 預載入語音（避免播放延遲）
async function preloadVoices(voiceUrls: string[]) {
  const sounds = await Promise.all(
    voiceUrls.map(url => Sound.preload(url))
  );
  return sounds;
}

// 使用快取
const voiceCache = new Map<string, Sound>();

async function playVoiceWithCache(voiceId: string, url: string) {
  let sound = voiceCache.get(voiceId);

  if (!sound) {
    sound = await Sound.load(url);
    voiceCache.set(voiceId, sound);
  }

  await sound.play();
}
```

---

## 變更記錄

- **v1 (2025-11-18)**：初始版本
