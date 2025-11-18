# API 合約：通知管理

專案：001-elderly-fitness-app | 版本：v1 | 日期：2025-11-18

## 基本資訊

**Base URL**：`https://api.fitness-app.com/v1`

**認證**：所有端點需要 JWT Bearer Token

---

## 端點列表

### 1. 取得通知列表

查詢用戶接收到的通知。

**端點**：`GET /notifications`

**權限**：所有已登入用戶

**查詢參數**：
```typescript
interface GetNotificationsQuery {
  page?: number;           // 頁數（預設 1）
  limit?: number;          // 每頁筆數（預設 20，最大 100）
  type?: 'EXERCISE_START' | 'EXERCISE_END' | 'INACTIVITY_ALERT' | 'EMERGENCY' | 'REWARD_REDEEMED' | 'ACHIEVEMENT_UNLOCKED';
  status?: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  isRead?: boolean;        // 是否已讀
  senderId?: string;       // 發送者 ID（篩選特定長輩的通知）
}
```

**回應**：`200 OK`
```typescript
interface GetNotificationsResponse {
  success: true;
  data: {
    notifications: Array<{
      id: string;
      type: NotificationType;
      title: string;
      body: string;
      data?: any;          // 額外資料（JSON）
      status: NotificationStatus;
      sender: {
        id: string;
        name: string;
        avatar: string;
        role: 'ELDER' | 'CHILD';
      };
      sentAt: string | null;
      deliveredAt: string | null;
      readAt: string | null;
      createdAt: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    unreadCount: number;   // 未讀通知總數
  };
}
```

---

### 2. 取得單一通知詳情

查詢特定通知的詳細資訊。

**端點**：`GET /notifications/:notificationId`

**權限**：僅限通知的接收者

**回應**：`200 OK`
```typescript
interface GetNotificationDetailResponse {
  success: true;
  data: {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: {
      // 依 type 不同而異
      exerciseId?: string;
      rewardId?: string;
      achievementId?: string;
      location?: {
        latitude: number;
        longitude: number;
      };
    };
    status: NotificationStatus;
    sender: {
      id: string;
      name: string;
      avatar: string;
      role: 'ELDER' | 'CHILD';
    };
    recipient: {
      id: string;
      name: string;
      avatar: string;
      role: 'ELDER' | 'CHILD';
    };
    sentAt: string | null;
    deliveredAt: string | null;
    readAt: string | null;
    createdAt: string;
  };
}
```

---

### 3. 標記通知為已讀

將一或多個通知標記為已讀。

**端點**：`POST /notifications/mark-read`

**請求主體**：
```typescript
interface MarkReadRequest {
  notificationIds: string[];   // 通知 ID 陣列
}
```

**範例請求**：
```json
{
  "notificationIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ]
}
```

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "markedCount": 2,
    "message": "已標記 2 則通知為已讀"
  }
}
```

---

### 4. 標記所有通知為已讀

將所有未讀通知標記為已讀。

**端點**：`POST /notifications/mark-all-read`

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "markedCount": 15,
    "message": "已標記 15 則通知為已讀"
  }
}
```

---

### 5. 刪除通知

刪除特定通知（軟刪除）。

**端點**：`DELETE /notifications/:notificationId`

**權限**：僅限通知的接收者

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "message": "通知已刪除"
  }
}
```

---

### 6. 取得未讀通知數量

快速查詢未讀通知總數（用於顯示角標）。

**端點**：`GET /notifications/unread-count`

**回應**：`200 OK`
```typescript
interface GetUnreadCountResponse {
  success: true;
  data: {
    unreadCount: number;
    byType: {
      EXERCISE_START: number;
      INACTIVITY_ALERT: number;
      EMERGENCY: number;
      REWARD_REDEEMED: number;
      ACHIEVEMENT_UNLOCKED: number;
    };
  };
}
```

---

### 7. 更新通知設定

更新用戶的通知偏好設定。

**端點**：`PATCH /notifications/settings`

**請求主體**：
```typescript
interface UpdateNotificationSettingsRequest {
  // 全域設定
  enablePushNotifications?: boolean;
  enableEmailNotifications?: boolean;

  // 分類設定
  notifyOnExerciseStart?: boolean;
  notifyOnExerciseEnd?: boolean;
  notifyOnInactivity?: boolean;
  notifyOnEmergency?: boolean;
  notifyOnReward?: boolean;
  notifyOnAchievement?: boolean;

  // 勿擾時段
  quietHours?: {
    enabled: boolean;
    startTime: string;   // HH:mm (24 小時制)
    endTime: string;     // HH:mm
  };
}
```

**範例請求**：
```json
{
  "enablePushNotifications": true,
  "notifyOnEmergency": true,
  "notifyOnInactivity": true,
  "notifyOnExerciseStart": false,
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "08:00"
  }
}
```

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "message": "通知設定已更新"
  }
}
```

---

### 8. 取得通知設定

查詢用戶的通知偏好設定。

**端點**：`GET /notifications/settings`

**回應**：`200 OK`
```typescript
interface GetNotificationSettingsResponse {
  success: true;
  data: {
    enablePushNotifications: boolean;
    enableEmailNotifications: boolean;
    notifyOnExerciseStart: boolean;
    notifyOnExerciseEnd: boolean;
    notifyOnInactivity: boolean;
    notifyOnEmergency: boolean;
    notifyOnReward: boolean;
    notifyOnAchievement: boolean;
    quietHours: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    } | null;
  };
}
```

---

### 9. 測試推播通知（開發用）

發送測試推播通知到當前裝置。

**端點**：`POST /notifications/test`

**請求主體**：
```typescript
interface TestNotificationRequest {
  title: string;
  body: string;
  type?: NotificationType;
}
```

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "message": "測試通知已發送",
    "sentTo": 2,
    "deviceTokens": ["token1", "token2"]
  }
}
```

**備註**：此端點僅在開發和測試環境可用

---

## 通知類型說明

| 類型 | 說明 | 觸發時機 | 優先級 |
|------|------|---------|--------|
| `EXERCISE_START` | 運動開始 | 長輩開始運動時 | DEFAULT |
| `EXERCISE_END` | 運動結束 | 長輩結束運動時 | DEFAULT |
| `INACTIVITY_ALERT` | 未活躍提醒 | 長輩 3 天未開啟 app | HIGH |
| `EMERGENCY` | 緊急求助 | 長輩觸發緊急求助 | HIGH |
| `REWARD_REDEEMED` | 兌換獎項 | 長輩兌換獎項時 | DEFAULT |
| `ACHIEVEMENT_UNLOCKED` | 解鎖成就 | 長輩達成新成就 | DEFAULT |

---

## WebSocket 即時推送

除了 FCM 推播，系統也會透過 WebSocket 即時推送通知給在線用戶。

**事件名稱**：
- `notification` - 一般通知
- `emergency_alert` - 緊急警報（高優先級）

**Payload**：
```typescript
interface NotificationEvent {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
  timestamp: string;
}
```

**客戶端監聽**：
```typescript
socket.on('notification', (data: NotificationEvent) => {
  // 更新通知列表
  addNotificationToList(data);

  // 更新角標數字
  incrementUnreadCount();

  // 顯示本地通知（如果 app 在背景）
  if (appState === 'background') {
    showLocalNotification(data);
  }
});

socket.on('emergency_alert', (data: NotificationEvent) => {
  // 顯示緊急警報 UI
  showEmergencyModal(data);

  // 播放警報聲
  playAlertSound();

  // 震動
  vibrate([0, 500, 200, 500, 200, 500]);
});
```

---

## 錯誤代碼總覽

| 錯誤代碼 | HTTP 狀態碼 | 說明 |
|---------|-----------|------|
| `NOTIFICATION_NOT_FOUND` | 404 | 通知不存在 |
| `FORBIDDEN` | 403 | 無權存取此通知 |
| `INVALID_QUIET_HOURS` | 400 | 勿擾時段設定無效 |

---

## 範例程式碼（客戶端）

```typescript
// 取得通知列表
async function getNotifications(page: number = 1) {
  const response = await fetchWithAuth(
    `/notifications?page=${page}&limit=20`
  );
  const result = await response.json();
  return result.data;
}

// 標記通知為已讀
async function markNotificationsAsRead(notificationIds: string[]) {
  await fetchWithAuth('/notifications/mark-read', {
    method: 'POST',
    body: JSON.stringify({ notificationIds }),
  });
}

// 取得未讀通知數量（顯示角標）
async function getUnreadCount() {
  const response = await fetchWithAuth('/notifications/unread-count');
  const result = await response.json();
  return result.data.unreadCount;
}

// 更新通知設定
async function updateNotificationSettings(settings: UpdateNotificationSettingsRequest) {
  await fetchWithAuth('/notifications/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

// 監聽即時通知
socket.on('notification', (data: NotificationEvent) => {
  // 新通知到達
  handleNewNotification(data);
});
```

---

## 變更記錄

- **v1 (2025-11-18)**：初始版本
