# API 合約：運動記錄

專案：001-elderly-fitness-app | 版本：v1 | 日期：2025-11-18

## 基本資訊

**Base URL**：`https://api.fitness-app.com/v1`

**認證**：所有端點需要 JWT Bearer Token

```http
Authorization: Bearer <access_token>
```

---

## 端點列表

### 1. 開始運動

長輩開始一次新的運動活動。

**端點**：`POST /exercise/start`

**權限**：僅限長輩角色（ELDER）

**請求主體**：
```typescript
interface StartExerciseRequest {
  type: 'WALKING' | 'TAICHI' | 'GYMNASTICS' | 'YOGA' | 'CYCLING' | 'SWIMMING' | 'OTHER';
  location?: {
    latitude: number;
    longitude: number;
    name?: string;  // 地點名稱（如「大安森林公園」）
  };
}
```

**範例請求**：
```json
{
  "type": "WALKING",
  "location": {
    "latitude": 25.0330,
    "longitude": 121.5654,
    "name": "大安森林公園"
  }
}
```

**回應**：`201 Created`
```typescript
interface StartExerciseResponse {
  success: true;
  data: {
    exerciseRecord: {
      id: string;
      elderId: string;
      type: string;
      startTime: string;      // ISO 8601
      endTime: null;
      status: 'IN_PROGRESS';
      location?: {
        latitude: number;
        longitude: number;
        name?: string;
      };
      createdAt: string;
    };
    notificationsSent: number;  // 已通知幾位子女
  };
}
```

**副作用**：
- 更新長輩的 `lastActiveAt` 時間戳記
- 發送推播通知給所有已綁定的子女
- 若有進行中的運動，自動標記為 CANCELLED

**錯誤回應**：

`403 Forbidden` - 非長輩角色
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "只有長輩可以開始運動"
  }
}
```

---

### 2. 結束運動

長輩結束當前進行中的運動。

**端點**：`POST /exercise/end`

**權限**：僅限長輩角色（ELDER）

**請求主體**：
```typescript
interface EndExerciseRequest {
  exerciseId: string;     // 運動記錄 ID
  endTime?: string;       // 結束時間（選填，預設為當前時間）ISO 8601
}
```

**範例請求**：
```json
{
  "exerciseId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**回應**：`200 OK`
```typescript
interface EndExerciseResponse {
  success: true;
  data: {
    exerciseRecord: {
      id: string;
      elderId: string;
      type: string;
      startTime: string;
      endTime: string;        // 結束時間
      durationMinutes: number;
      status: 'COMPLETED';
      pointsEarned: number;   // 獲得的點數
      location?: {
        latitude: number;
        longitude: number;
        name?: string;
      };
      createdAt: string;
      updatedAt: string;
    };
    userStats: {
      currentPoints: number;      // 更新後的可用點數
      totalPoints: number;        // 更新後的累積總點數
      consecutiveDays: number;    // 連續運動天數
      todayTotalMinutes: number;  // 今日總運動時長
    };
    achievementsUnlocked: Array<{  // 新解鎖的成就
      id: string;
      name: string;
      description: string;
      iconUrl: string;
      pointsReward: number;
    }>;
  };
}
```

**點數計算規則**：
```typescript
const durationMinutes = Math.floor((endTime - startTime) / 60000);
const pointsEarned = Math.min(durationMinutes, 100); // 單次最多 100 點

// 檢查今日已獲得點數
const todayPoints = await getTodayTotalPoints(elderId);
const availablePoints = Math.max(0, 100 - todayPoints); // 每日上限 100 點
const actualPointsEarned = Math.min(pointsEarned, availablePoints);
```

**副作用**：
- 更新長輩點數（`currentPoints`、`totalPoints`）
- 檢查並解鎖成就
- 更新連續運動天數
- 若有新成就，發送通知給長輩和子女

**錯誤回應**：

`404 Not Found` - 運動記錄不存在
```json
{
  "success": false,
  "error": {
    "code": "EXERCISE_NOT_FOUND",
    "message": "找不到指定的運動記錄"
  }
}
```

`400 Bad Request` - 運動已結束
```json
{
  "success": false,
  "error": {
    "code": "EXERCISE_ALREADY_ENDED",
    "message": "此運動已經結束"
  }
}
```

---

### 3. 取得運動記錄列表

查詢長輩的運動記錄（支援分頁和篩選）。

**端點**：`GET /exercise`

**權限**：
- 長輩：查詢自己的記錄
- 子女：查詢已綁定長輩的記錄（需提供 `elderId`）

**查詢參數**：
```typescript
interface GetExercisesQuery {
  elderId?: string;         // 長輩 ID（子女查詢時必填）
  page?: number;            // 頁數（預設 1）
  limit?: number;           // 每頁筆數（預設 20，最大 100）
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  type?: 'WALKING' | 'TAICHI' | 'GYMNASTICS' | 'YOGA' | 'CYCLING' | 'SWIMMING' | 'OTHER';
  startDate?: string;       // 開始日期篩選（ISO 8601）
  endDate?: string;         // 結束日期篩選（ISO 8601）
  sortBy?: 'startTime' | 'durationMinutes' | 'pointsEarned';
  order?: 'asc' | 'desc';   // 預設 desc
}
```

**範例請求**：
```http
GET /exercise?elderId=123&page=1&limit=20&status=COMPLETED&sortBy=startTime&order=desc
```

**回應**：`200 OK`
```typescript
interface GetExercisesResponse {
  success: true;
  data: {
    exercises: Array<{
      id: string;
      elderId: string;
      type: string;
      startTime: string;
      endTime: string | null;
      durationMinutes: number | null;
      status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
      pointsEarned: number;
      location?: {
        latitude: number;
        longitude: number;
        name?: string;
      };
      createdAt: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}
```

**錯誤回應**：

`403 Forbidden` - 子女未綁定該長輩
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "您沒有權限查看此長輩的運動記錄"
  }
}
```

---

### 4. 取得單一運動記錄詳情

查詢特定運動記錄的詳細資訊。

**端點**：`GET /exercise/:exerciseId`

**權限**：
- 長輩：自己的記錄
- 子女：已綁定長輩的記錄

**回應**：`200 OK`
```typescript
interface GetExerciseDetailResponse {
  success: true;
  data: {
    id: string;
    elderId: string;
    elderName: string;      // 長輩姓名
    type: string;
    startTime: string;
    endTime: string | null;
    durationMinutes: number | null;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    pointsEarned: number;
    location?: {
      latitude: number;
      longitude: number;
      name?: string;
    };
    // 擴展資訊（未來可用）
    steps?: number;
    calories?: number;
    heartRate?: number;
    createdAt: string;
    updatedAt: string;
  };
}
```

---

### 5. 取得運動統計

查詢長輩的運動統計資料。

**端點**：`GET /exercise/stats`

**權限**：
- 長輩：查詢自己的統計
- 子女：查詢已綁定長輩的統計（需提供 `elderId`）

**查詢參數**：
```typescript
interface GetStatsQuery {
  elderId?: string;          // 長輩 ID（子女查詢時必填）
  period?: 'week' | 'month' | 'year' | 'all';  // 統計期間（預設 month）
}
```

**範例請求**：
```http
GET /exercise/stats?elderId=123&period=month
```

**回應**：`200 OK`
```typescript
interface GetStatsResponse {
  success: true;
  data: {
    period: 'week' | 'month' | 'year' | 'all';
    summary: {
      totalExercises: number;        // 總運動次數
      totalDurationMinutes: number;  // 總運動時長（分鐘）
      totalPointsEarned: number;     // 總獲得點數
      averageDurationMinutes: number; // 平均每次時長
      consecutiveDays: number;       // 連續運動天數
      mostFrequentType: string;      // 最常做的運動類型
    };
    byType: Array<{
      type: string;
      count: number;
      totalMinutes: number;
      percentage: number;  // 佔比（%）
    }>;
    byDay: Array<{
      date: string;        // YYYY-MM-DD
      exercises: number;
      minutes: number;
      points: number;
    }>;
    achievements: {
      total: number;
      recent: Array<{
        id: string;
        name: string;
        iconUrl: string;
        unlockedAt: string;
      }>;
    };
  };
}
```

---

### 6. 更新運動記錄

修改運動記錄的資訊（限已完成的記錄）。

**端點**：`PATCH /exercise/:exerciseId`

**權限**：僅限長輩本人修改自己的記錄

**請求主體**：
```typescript
interface UpdateExerciseRequest {
  type?: 'WALKING' | 'TAICHI' | 'GYMNASTICS' | 'YOGA' | 'CYCLING' | 'SWIMMING' | 'OTHER';
  startTime?: string;     // ISO 8601
  endTime?: string;       // ISO 8601
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
}
```

**範例請求**：
```json
{
  "type": "TAICHI",
  "location": {
    "name": "中正紀念堂"
  }
}
```

**回應**：`200 OK`
```typescript
interface UpdateExerciseResponse {
  success: true;
  data: {
    // 更新後的運動記錄（同 GET /exercise/:exerciseId）
  };
}
```

**限制**：
- 只能修改 `COMPLETED` 狀態的記錄
- 修改時間後會重新計算點數
- 若修改後的時長超過當日上限，會扣回多餘的點數

**錯誤回應**：

`400 Bad Request` - 無法修改進行中的運動
```json
{
  "success": false,
  "error": {
    "code": "CANNOT_UPDATE_IN_PROGRESS",
    "message": "進行中的運動無法修改，請先結束運動"
  }
}
```

---

### 7. 刪除運動記錄

刪除運動記錄（軟刪除）。

**端點**：`DELETE /exercise/:exerciseId`

**權限**：僅限長輩本人刪除自己的記錄

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "message": "運動記錄已刪除"
  }
}
```

**副作用**：
- 扣除該記錄獲得的點數
- 重新計算連續運動天數
- 檢查成就是否需要撤銷（如果刪除後不符合條件）

---

### 8. 取得進行中的運動

查詢長輩當前是否有進行中的運動。

**端點**：`GET /exercise/current`

**權限**：
- 長輩：查詢自己的
- 子女：查詢已綁定長輩的（需提供 `elderId`）

**查詢參數**：
```typescript
interface GetCurrentExerciseQuery {
  elderId?: string;  // 子女查詢時必填
}
```

**回應**：`200 OK`

有進行中的運動：
```typescript
interface GetCurrentExerciseResponse {
  success: true;
  data: {
    hasOngoingExercise: true;
    exercise: {
      id: string;
      type: string;
      startTime: string;
      elapsedMinutes: number;  // 已經過的分鐘數
      location?: {
        latitude: number;
        longitude: number;
        name?: string;
      };
      createdAt: string;
    };
  };
}
```

沒有進行中的運動：
```json
{
  "success": true,
  "data": {
    "hasOngoingExercise": false,
    "exercise": null
  }
}
```

---

### 9. 緊急求助

長輩在運動中觸發緊急求助。

**端點**：`POST /exercise/emergency`

**權限**：僅限長輩角色（ELDER）

**請求主體**：
```typescript
interface EmergencyRequest {
  exerciseId?: string;    // 當前運動 ID（選填）
  location?: {
    latitude: number;
    longitude: number;
  };
  message?: string;       // 附加訊息（選填）
}
```

**範例請求**：
```json
{
  "exerciseId": "550e8400-e29b-41d4-a716-446655440000",
  "location": {
    "latitude": 25.0330,
    "longitude": 121.5654
  },
  "message": "感覺不太舒服"
}
```

**回應**：`200 OK`
```typescript
interface EmergencyResponse {
  success: true;
  data: {
    emergencyId: string;
    notificationsSent: number;  // 已通知幾位子女
    timestamp: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    canCancel: true;            // 是否可以取消（30 秒內）
    cancelDeadline: string;     // 取消截止時間
  };
}
```

**副作用**：
- 立即發送高優先級推播通知給所有子女
- 透過 WebSocket 即時推送（若子女在線）
- 記錄到 Notification 表格
- 若有提供 exerciseId，標記該運動為需要關注

---

### 10. 取消緊急求助

取消誤發的緊急求助（30 秒內）。

**端點**：`POST /exercise/emergency/cancel`

**權限**：僅限長輩本人

**請求主體**：
```typescript
interface CancelEmergencyRequest {
  emergencyId: string;
}
```

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "message": "緊急求助已取消"
  }
}
```

**副作用**：
- 發送取消通知給所有子女

**錯誤回應**：

`400 Bad Request` - 超過取消時限
```json
{
  "success": false,
  "error": {
    "code": "CANCEL_DEADLINE_EXCEEDED",
    "message": "已超過取消時限（30 秒），無法取消緊急求助"
  }
}
```

---

## 錯誤代碼總覽

| 錯誤代碼 | HTTP 狀態碼 | 說明 |
|---------|-----------|------|
| `FORBIDDEN` | 403 | 非長輩角色或無權限查看 |
| `EXERCISE_NOT_FOUND` | 404 | 運動記錄不存在 |
| `EXERCISE_ALREADY_ENDED` | 400 | 運動已結束 |
| `CANNOT_UPDATE_IN_PROGRESS` | 400 | 無法修改進行中的運動 |
| `CANCEL_DEADLINE_EXCEEDED` | 400 | 超過緊急求助取消時限 |
| `DAILY_POINTS_LIMIT_REACHED` | 400 | 已達每日點數上限 |

---

## WebSocket 事件

緊急求助使用 WebSocket 即時推送：

**事件名稱**：`emergency_alert`

**Payload**：
```typescript
interface EmergencyAlertEvent {
  emergencyId: string;
  elder: {
    id: string;
    name: string;
    avatar: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  message?: string;
  timestamp: string;
  exerciseId?: string;
}
```

**客戶端監聽**：
```typescript
socket.on('emergency_alert', (data: EmergencyAlertEvent) => {
  // 顯示緊急警報 UI
  showEmergencyAlert(data);

  // 播放警報聲
  playAlertSound();

  // 震動
  vibrate();
});
```

---

## 範例程式碼（客戶端）

```typescript
// 開始運動
async function startExercise(type: ExerciseType) {
  const location = await getCurrentLocation();

  const response = await fetchWithAuth('/exercise/start', {
    method: 'POST',
    body: JSON.stringify({
      type,
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      } : undefined,
    }),
  });

  const result = await response.json();
  return result.data.exerciseRecord;
}

// 結束運動
async function endExercise(exerciseId: string) {
  const response = await fetchWithAuth('/exercise/end', {
    method: 'POST',
    body: JSON.stringify({ exerciseId }),
  });

  const result = await response.json();

  // 檢查是否有新成就
  if (result.data.achievementsUnlocked.length > 0) {
    showAchievementNotification(result.data.achievementsUnlocked);
  }

  return result.data;
}

// 查詢運動記錄
async function getExerciseHistory(page: number = 1) {
  const response = await fetchWithAuth(
    `/exercise?page=${page}&limit=20&status=COMPLETED&sortBy=startTime&order=desc`
  );

  const result = await response.json();
  return result.data;
}

// 緊急求助
async function sendEmergencyAlert(exerciseId?: string) {
  const location = await getCurrentLocation();

  const response = await fetchWithAuth('/exercise/emergency', {
    method: 'POST',
    body: JSON.stringify({
      exerciseId,
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      } : undefined,
    }),
  });

  const result = await response.json();

  // 設定 30 秒倒數計時器（可取消警報）
  setCancelTimeout(result.data.emergencyId, result.data.cancelDeadline);

  return result.data;
}
```

---

## 變更記錄

- **v1 (2025-11-18)**：初始版本
