# API 合約：獎項與成就系統

專案：001-elderly-fitness-app | 版本：v1 | 日期：2025-11-18

## 基本資訊

**Base URL**：`https://api.fitness-app.com/v1`

**認證**：所有端點需要 JWT Bearer Token

---

## 獎項 API

### 1. 取得獎項商城列表

查詢可兌換的獎項（包含系統預設和子女自訂）。

**端點**：`GET /rewards`

**權限**：所有已登入用戶

**查詢參數**：
```typescript
interface GetRewardsQuery {
  type?: 'SYSTEM' | 'CUSTOM';           // 獎項類型
  category?: 'BADGE' | 'TITLE' | 'GIFT' | 'COUPON';
  elderId?: string;                     // 長輩 ID（查詢為特定長輩建立的自訂獎項）
  minPoints?: number;                   // 最低點數篩選
  maxPoints?: number;                   // 最高點數篩選
  isActive?: boolean;                   // 是否啟用
  page?: number;
  limit?: number;
}
```

**回應**：`200 OK`
```typescript
interface GetRewardsResponse {
  success: true;
  data: {
    rewards: Array<{
      id: string;
      name: string;
      description: string;
      iconUrl: string;
      pointsCost: number;
      type: 'SYSTEM' | 'CUSTOM';
      category: 'BADGE' | 'TITLE' | 'GIFT' | 'COUPON';
      stock: number | null;              // 庫存（null = 無限）
      maxRedemptionPerUser: number | null;
      isActive: boolean;
      // 自訂獎項才有
      createdBy?: {
        id: string;
        name: string;
      };
      // 用戶狀態
      userRedemptionCount?: number;      // 用戶已兌換次數
      canRedeem: boolean;                // 是否可兌換
      canRedeemReason?: string;          // 不可兌換的原因
      createdAt: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
}
```

---

### 2. 取得單一獎項詳情

查詢特定獎項的詳細資訊。

**端點**：`GET /rewards/:rewardId`

**回應**：`200 OK`
```typescript
interface GetRewardDetailResponse {
  success: true;
  data: {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    pointsCost: number;
    type: 'SYSTEM' | 'CUSTOM';
    category: 'BADGE' | 'TITLE' | 'GIFT' | 'COUPON';
    stock: number | null;
    maxRedemptionPerUser: number | null;
    isActive: boolean;
    createdBy?: {
      id: string;
      name: string;
      avatar: string;
    };
    // 兌換統計
    stats: {
      totalRedemptions: number;
      uniqueUsers: number;
    };
    // 當前用戶狀態（長輩才有）
    userStatus?: {
      hasRedeemed: boolean;
      redemptionCount: number;
      canRedeem: boolean;
      reason?: string;
    };
    createdAt: string;
    updatedAt: string;
  };
}
```

---

### 3. 兌換獎項

長輩使用點數兌換獎項。

**端點**：`POST /rewards/:rewardId/redeem`

**權限**：僅限長輩角色（ELDER）

**請求主體**：
```typescript
interface RedeemRewardRequest {
  // 無需額外參數，獎項 ID 在 URL 路徑中
}
```

**回應**：`201 Created`
```typescript
interface RedeemRewardResponse {
  success: true;
  data: {
    redemption: {
      id: string;
      reward: {
        id: string;
        name: string;
        description: string;
        iconUrl: string;
      };
      pointsSpent: number;
      redeemedAt: string;
    };
    userStats: {
      currentPoints: number;       // 更新後的可用點數
      totalRedemptions: number;    // 總兌換次數
    };
    notificationsSent: number;     // 已通知幾位子女
  };
}
```

**副作用**：
- 扣除長輩的 `currentPoints`
- 記錄到 `RedeemedReward` 表格
- 發送通知給所有已綁定的子女
- 若獎項有庫存限制，扣除庫存

**錯誤回應**：

`400 Bad Request` - 點數不足
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_POINTS",
    "message": "點數不足，需要 100 點，目前僅有 50 點"
  }
}
```

`400 Bad Request` - 已達兌換上限
```json
{
  "success": false,
  "error": {
    "code": "REDEMPTION_LIMIT_REACHED",
    "message": "已達此獎項的兌換上限"
  }
}
```

`400 Bad Request` - 庫存不足
```json
{
  "success": false,
  "error": {
    "code": "OUT_OF_STOCK",
    "message": "此獎項已無庫存"
  }
}
```

---

### 4. 取得已兌換獎項列表

查詢長輩已兌換的獎項（我的收藏）。

**端點**：`GET /rewards/redeemed`

**權限**：
- 長輩：查詢自己的
- 子女：查詢已綁定長輩的（需提供 `elderId`）

**查詢參數**：
```typescript
interface GetRedeemedRewardsQuery {
  elderId?: string;     // 子女查詢時必填
  category?: 'BADGE' | 'TITLE' | 'GIFT' | 'COUPON';
  page?: number;
  limit?: number;
}
```

**回應**：`200 OK`
```typescript
interface GetRedeemedRewardsResponse {
  success: true;
  data: {
    redeemedRewards: Array<{
      id: string;
      reward: {
        id: string;
        name: string;
        description: string;
        iconUrl: string;
        category: string;
      };
      pointsSpent: number;
      redeemedAt: string;
    }>;
    stats: {
      totalRedemptions: number;
      totalPointsSpent: number;
      byCategory: {
        BADGE: number;
        TITLE: number;
        GIFT: number;
        COUPON: number;
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

### 5. 創建自訂獎項

子女為長輩創建自訂獎項。

**端點**：`POST /rewards`

**權限**：僅限子女角色（CHILD）

**請求主體**：
```typescript
interface CreateRewardRequest {
  elderId: string;                     // 長輩 ID（必須已綁定）
  name: string;                        // 獎項名稱（最多 50 字）
  description: string;                 // 獎項描述（最多 200 字）
  iconUrl?: string;                    // 圖示 URL（選填，使用預設圖示）
  pointsCost: number;                  // 所需點數（1-10000）
  category: 'BADGE' | 'TITLE' | 'GIFT' | 'COUPON';
  stock?: number | null;               // 庫存（選填，預設 null = 無限）
  maxRedemptionPerUser?: number | null; // 兌換上限（選填）
}
```

**範例請求**：
```json
{
  "elderId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "週末家庭聚餐券",
  "description": "可兌換一次週末家庭聚餐，由子女請客",
  "pointsCost": 500,
  "category": "COUPON",
  "stock": 4,
  "maxRedemptionPerUser": 1
}
```

**回應**：`201 Created`
```typescript
interface CreateRewardResponse {
  success: true;
  data: {
    reward: {
      id: string;
      name: string;
      description: string;
      iconUrl: string;
      pointsCost: number;
      type: 'CUSTOM';
      category: string;
      stock: number | null;
      maxRedemptionPerUser: number | null;
      isActive: true;
      createdBy: {
        id: string;
        name: string;
      };
      createdAt: string;
    };
  };
}
```

**副作用**：
- 發送通知給長輩「子女為您建立了新獎項」

**錯誤回應**：

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

### 6. 更新自訂獎項

子女修改自己創建的獎項。

**端點**：`PATCH /rewards/:rewardId`

**權限**：僅限獎項創建者

**請求主體**：
```typescript
interface UpdateRewardRequest {
  name?: string;
  description?: string;
  iconUrl?: string;
  pointsCost?: number;
  stock?: number | null;
  maxRedemptionPerUser?: number | null;
  isActive?: boolean;         // 停用/啟用獎項
}
```

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    // 更新後的獎項資料
  }
}
```

---

### 7. 刪除自訂獎項

子女刪除自己創建的獎項。

**端點**：`DELETE /rewards/:rewardId`

**權限**：僅限獎項創建者

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "message": "獎項已刪除"
  }
}
```

**限制**：
- 無法刪除系統預設獎項
- 若獎項已被兌換，僅標記為停用（不真正刪除）

---

### 8. 上傳獎項圖示

上傳自訂獎項的圖示圖片。

**端點**：`POST /rewards/icon`

**權限**：僅限子女角色（CHILD）

**請求標頭**：
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**請求主體**（FormData）：
```
icon: File  // 圖片檔案（支援 JPG, PNG，最大 2MB）
```

**回應**：`200 OK`
```typescript
interface UploadRewardIconResponse {
  success: true;
  data: {
    iconUrl: string;  // S3 URL
  };
}
```

---

## 成就 API

### 9. 取得成就列表

查詢所有可解鎖的成就。

**端點**：`GET /achievements`

**權限**：所有已登入用戶

**回應**：`200 OK`
```typescript
interface GetAchievementsResponse {
  success: true;
  data: {
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      iconUrl: string;
      conditionType: 'FIRST_EXERCISE' | 'CONSECUTIVE_DAYS' | 'TOTAL_EXERCISES' | 'TOTAL_DURATION_HOURS' | 'REDEEM_REWARD';
      conditionValue: number;
      pointsReward: number;
      // 用戶狀態（長輩才有）
      userStatus?: {
        isUnlocked: boolean;
        unlockedAt?: string;
        progress: number;          // 進度（0-100%）
        currentValue: number;      // 當前值
        targetValue: number;       // 目標值
      };
      createdAt: string;
    }>;
    stats: {
      total: number;
      unlocked: number;
      inProgress: number;
    };
  };
}
```

---

### 10. 取得已解鎖成就列表

查詢長輩已解鎖的成就。

**端點**：`GET /achievements/unlocked`

**權限**：
- 長輩：查詢自己的
- 子女：查詢已綁定長輩的（需提供 `elderId`）

**查詢參數**：
```typescript
interface GetUnlockedAchievementsQuery {
  elderId?: string;     // 子女查詢時必填
  page?: number;
  limit?: number;
}
```

**回應**：`200 OK`
```typescript
interface GetUnlockedAchievementsResponse {
  success: true;
  data: {
    achievements: Array<{
      id: string;
      achievement: {
        id: string;
        name: string;
        description: string;
        iconUrl: string;
        pointsReward: number;
      };
      unlockedAt: string;
    }>;
    stats: {
      totalUnlocked: number;
      totalPointsEarned: number;
      recentUnlocks: number;       // 最近 7 天解鎖數
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

### 11. 取得成就進度

查詢長輩在各成就的進度。

**端點**：`GET /achievements/progress`

**權限**：
- 長輩：查詢自己的
- 子女：查詢已綁定長輩的（需提供 `elderId`）

**查詢參數**：
```typescript
interface GetAchievementProgressQuery {
  elderId?: string;     // 子女查詢時必填
}
```

**回應**：`200 OK`
```typescript
interface GetAchievementProgressResponse {
  success: true;
  data: {
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      iconUrl: string;
      conditionType: string;
      targetValue: number;
      currentValue: number;
      progress: number;          // 0-100
      isUnlocked: boolean;
      unlockedAt?: string;
      estimatedDaysToUnlock?: number;  // 預估還需幾天（依當前速率）
    }>;
    summary: {
      totalAchievements: number;
      unlocked: number;
      almostUnlocked: number;    // 進度 > 80%
    };
  };
}
```

---

## 錯誤代碼總覽

| 錯誤代碼 | HTTP 狀態碼 | 說明 |
|---------|-----------|------|
| `REWARD_NOT_FOUND` | 404 | 獎項不存在 |
| `ACHIEVEMENT_NOT_FOUND` | 404 | 成就不存在 |
| `INSUFFICIENT_POINTS` | 400 | 點數不足 |
| `REDEMPTION_LIMIT_REACHED` | 400 | 已達兌換上限 |
| `OUT_OF_STOCK` | 400 | 獎項庫存不足 |
| `NOT_BOUND_TO_ELDER` | 403 | 未綁定該長輩 |
| `FORBIDDEN` | 403 | 無權操作此獎項 |
| `INVALID_POINTS_COST` | 400 | 點數設定無效（1-10000） |

---

## 範例程式碼（客戶端）

```typescript
// 取得獎項商城
async function getRewardsShop() {
  const response = await fetchWithAuth(
    '/rewards?isActive=true&sortBy=pointsCost&order=asc'
  );
  const result = await response.json();
  return result.data.rewards;
}

// 兌換獎項
async function redeemReward(rewardId: string) {
  const response = await fetchWithAuth(`/rewards/${rewardId}/redeem`, {
    method: 'POST',
  });
  const result = await response.json();

  if (result.success) {
    showSuccessMessage(`成功兌換 ${result.data.redemption.reward.name}`);
    updateUserPoints(result.data.userStats.currentPoints);
  } else {
    showErrorMessage(result.error.message);
  }

  return result.data;
}

// 子女創建自訂獎項
async function createCustomReward(elderId: string, rewardData: CreateRewardRequest) {
  const response = await fetchWithAuth('/rewards', {
    method: 'POST',
    body: JSON.stringify({
      elderId,
      ...rewardData,
    }),
  });
  const result = await response.json();
  return result.data.reward;
}

// 取得成就進度
async function getAchievementProgress() {
  const response = await fetchWithAuth('/achievements/progress');
  const result = await response.json();
  return result.data;
}

// 查看已兌換獎項（我的收藏）
async function getMyRewards() {
  const response = await fetchWithAuth('/rewards/redeemed');
  const result = await response.json();
  return result.data;
}
```

---

## 變更記錄

- **v1 (2025-11-18)**：初始版本
