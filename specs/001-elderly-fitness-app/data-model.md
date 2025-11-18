# 資料模型：長輩運動關懷應用程式

專案：001-elderly-fitness-app | 日期：2025-11-18

## 概述

本文檔定義長輩運動 app 的完整資料庫架構，使用 PostgreSQL 16 作為主要資料庫，Prisma ORM 作為資料存取層。

## 實體關聯圖（ERD）

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    User     │◄───────►│   Binding    │◄───────►│    User     │
│  (Elder)    │  1    * │              │ *    1  │   (Child)   │
└─────────────┘         └──────────────┘         └─────────────┘
      │ 1                                               │ 1
      │                                                 │
      │ *                                               │ *
┌─────────────────┐                             ┌─────────────────┐
│ ExerciseRecord  │                             │  VoiceMessage   │
└─────────────────┘                             └─────────────────┘
      │ 1
      │
      │ *
┌─────────────────┐         ┌──────────────┐
│ Notification    │         │    Reward    │
└─────────────────┘         └──────────────┘
                                   │ *
                                   │
                                   │ 1
                            ┌──────────────┐
                            │    User      │
                            │   (Elder)    │
                            └──────────────┘
                                   │ *
                                   │
                                   │ *
                            ┌──────────────────┐
                            │ UserAchievement  │
                            └──────────────────┘
                                   │ *
                                   │
                                   │ 1
                            ┌──────────────┐
                            │ Achievement  │
                            └──────────────┘
```

## 資料表定義

### 1. User（用戶表）

儲存所有用戶資料，包含長輩和子女兩種角色。

```prisma
model User {
  // 主鍵
  id                String   @id @default(uuid())

  // 基本資訊
  email             String   @unique
  passwordHash      String   @map("password_hash")
  name              String
  avatar            String?
  phone             String?
  birthDate         DateTime? @map("birth_date")

  // 角色
  role              UserRole // ELDER 或 CHILD

  // 長輩專屬欄位
  totalPoints       Int      @default(0) @map("total_points")
  currentPoints     Int      @default(0) @map("current_points")
  consecutiveDays   Int      @default(0) @map("consecutive_days")
  lastActiveAt      DateTime? @map("last_active_at")

  // 系統欄位
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  deletedAt         DateTime? @map("deleted_at") // 軟刪除

  // 關聯關係
  elderBindings     Binding[] @relation("ElderBindings")
  childBindings     Binding[] @relation("ChildBindings")
  exerciseRecords   ExerciseRecord[]
  sentNotifications Notification[] @relation("SentNotifications")
  receivedNotifications Notification[] @relation("ReceivedNotifications")
  voiceMessagesAsChild VoiceMessage[] @relation("ChildVoiceMessages")
  voiceMessagesAsElder VoiceMessage[] @relation("ElderVoiceMessages")
  customRewards     Reward[] @relation("CreatedRewards")
  redeemed Rewards  RedeemedReward[]
  achievements      UserAchievement[]
  deviceTokens      DeviceToken[]

  @@map("users")
  @@index([email])
  @@index([role])
  @@index([lastActiveAt])
}

enum UserRole {
  ELDER
  CHILD
}
```

**欄位說明**：
- `id`：UUID 主鍵
- `email`：登入用電子郵件（唯一）
- `passwordHash`：Bcrypt 加密的密碼雜湊
- `name`：用戶顯示名稱
- `avatar`：頭像 URL（儲存於 S3）
- `phone`：電話號碼（選填，用於緊急聯絡）
- `birthDate`：出生年月日（長輩可選填）
- `role`：用戶角色（ELDER 或 CHILD）
- `totalPoints`：累積總點數（長輩）
- `currentPoints`：可用點數餘額（長輩）
- `consecutiveDays`：連續運動天數（長輩）
- `lastActiveAt`：最後活躍時間（用於檢測 3 天未開啟）
- `deletedAt`：軟刪除時間戳記

**索引**：
- `email`：加速登入查詢
- `role`：加速角色篩選
- `lastActiveAt`：加速活躍度檢查（定時任務）

---

### 2. Binding（綁定關係表）

儲存長輩和子女之間的綁定關係。

```prisma
model Binding {
  // 主鍵
  id          String   @id @default(uuid())

  // 關聯
  elderId     String   @map("elder_id")
  elder       User     @relation("ElderBindings", fields: [elderId], references: [id], onDelete: Cascade)

  childId     String   @map("child_id")
  child       User     @relation("ChildBindings", fields: [childId], references: [id], onDelete: Cascade)

  // 綁定狀態
  status      BindingStatus @default(PENDING)
  inviteCode  String?  @unique @map("invite_code") // 綁定邀請碼

  // 通知設定
  notifyOnExerciseStart Boolean @default(true) @map("notify_on_exercise_start")
  notifyOnInactivity    Boolean @default(true) @map("notify_on_inactivity")
  notifyOnEmergency     Boolean @default(true) @map("notify_on_emergency")

  // 系統欄位
  createdAt   DateTime @default(now()) @map("created_at")
  confirmedAt DateTime? @map("confirmed_at")
  deletedAt   DateTime? @map("deleted_at")

  @@map("bindings")
  @@unique([elderId, childId])
  @@index([elderId])
  @@index([childId])
  @@index([inviteCode])
  @@index([status])
}

enum BindingStatus {
  PENDING    // 待確認
  CONFIRMED  // 已確認
  REJECTED   // 已拒絕
}
```

**欄位說明**：
- `elderId`：長輩 ID（外鍵）
- `childId`：子女 ID（外鍵）
- `status`：綁定狀態（待確認/已確認/已拒絕）
- `inviteCode`：6 位數綁定邀請碼（如：ABC123）
- `notifyOn*`：通知偏好設定（子女可自訂）
- `confirmedAt`：確認綁定的時間

**索引**：
- `elderId, childId`：唯一約束（同一對關係不重複）
- `inviteCode`：加速綁定碼查詢

---

### 3. ExerciseRecord（運動記錄表）

儲存長輩的每次運動記錄。

```prisma
model ExerciseRecord {
  // 主鍵
  id            String   @id @default(uuid())

  // 關聯
  elderId       String   @map("elder_id")
  elder         User     @relation(fields: [elderId], references: [id], onDelete: Cascade)

  // 運動資訊
  type          ExerciseType
  startTime     DateTime @map("start_time")
  endTime       DateTime? @map("end_time")
  durationMinutes Int?   @map("duration_minutes") // 計算欄位
  status        ExerciseStatus @default(IN_PROGRESS)

  // 點數
  pointsEarned  Int      @default(0) @map("points_earned")

  // 位置資訊（選填）
  latitude      Float?
  longitude     Float?
  locationName  String?  @map("location_name")

  // 統計資料（擴展用）
  steps         Int?     // 步數（未來可擴展）
  calories      Int?     // 卡路里（未來可擴展）
  heartRate     Int?     @map("heart_rate") // 心率（未來可擴展）

  // 系統欄位
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("exercise_records")
  @@index([elderId])
  @@index([startTime])
  @@index([status])
}

enum ExerciseType {
  WALKING      // 散步
  TAICHI       // 太極
  GYMNASTICS   // 體操
  YOGA         // 瑜珈
  CYCLING      // 騎腳踏車
  SWIMMING     // 游泳
  OTHER        // 其他
}

enum ExerciseStatus {
  IN_PROGRESS  // 進行中
  COMPLETED    // 已完成
  CANCELLED    // 已取消（忘記結束）
}
```

**欄位說明**：
- `elderId`：長輩 ID（外鍵）
- `type`：運動類型
- `startTime`：開始時間
- `endTime`：結束時間（進行中時為 null）
- `durationMinutes`：總時長（分鐘）= (endTime - startTime) / 60
- `status`：運動狀態
- `pointsEarned`：此次運動獲得的點數
- `latitude/longitude`：運動位置（選填）

**計算邏輯**：
```typescript
// 結束運動時計算
const durationMinutes = Math.floor((endTime - startTime) / 60000);
const pointsEarned = Math.min(durationMinutes, 100); // 上限 100 點/天
```

**索引**：
- `elderId`：查詢特定長輩的記錄
- `startTime`：時間範圍查詢
- `status`：篩選進行中的運動

---

### 4. Notification（通知表）

儲存所有推播通知記錄（用於追蹤和補發）。

```prisma
model Notification {
  // 主鍵
  id          String   @id @default(uuid())

  // 關聯
  senderId    String   @map("sender_id") // 長輩 ID
  sender      User     @relation("SentNotifications", fields: [senderId], references: [id], onDelete: Cascade)

  recipientId String   @map("recipient_id") // 子女 ID
  recipient   User     @relation("ReceivedNotifications", fields: [recipientId], references: [id], onDelete: Cascade)

  // 通知內容
  type        NotificationType
  title       String
  body        String
  data        Json?    // 額外資料（JSON 格式）

  // 發送狀態
  status      NotificationStatus @default(PENDING)
  sentAt      DateTime? @map("sent_at")
  deliveredAt DateTime? @map("delivered_at")
  readAt      DateTime? @map("read_at")

  // 重試資訊
  retryCount  Int      @default(0) @map("retry_count")
  lastError   String?  @map("last_error")

  // 系統欄位
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("notifications")
  @@index([recipientId])
  @@index([type])
  @@index([status])
  @@index([createdAt])
}

enum NotificationType {
  EXERCISE_START      // 運動開始
  EXERCISE_END        // 運動結束
  INACTIVITY_ALERT    // 未開啟 app（3 天）
  EMERGENCY           // 緊急求助
  REWARD_REDEEMED     // 兌換獎項
  ACHIEVEMENT_UNLOCKED // 解鎖成就
}

enum NotificationStatus {
  PENDING    // 待發送
  SENT       // 已發送
  DELIVERED  // 已送達
  FAILED     // 發送失敗
}
```

**欄位說明**：
- `senderId`：發送者（長輩）
- `recipientId`：接收者（子女）
- `type`：通知類型
- `title/body`：通知標題和內容
- `data`：額外資料（如運動記錄 ID、位置資訊等）
- `status`：發送狀態
- `sentAt/deliveredAt/readAt`：時間戳記
- `retryCount`：重試次數

**索引**：
- `recipientId`：查詢特定用戶的通知
- `type`：通知類型統計
- `status`：篩選待發送通知
- `createdAt`：時間範圍查詢

---

### 5. Reward（獎項表）

儲存系統預設和子女自訂的獎項。

```prisma
model Reward {
  // 主鍵
  id          String   @id @default(uuid())

  // 基本資訊
  name        String
  description String
  iconUrl     String   @map("icon_url")
  pointsCost  Int      @map("points_cost")

  // 獎項類型
  type        RewardType
  category    RewardCategory

  // 創建者（自訂獎項）
  createdById String?  @map("created_by_id")
  createdBy   User?    @relation("CreatedRewards", fields: [createdById], references: [id], onDelete: Cascade)

  // 限制
  isActive    Boolean  @default(true) @map("is_active")
  stock       Int?     // 庫存（null = 無限）
  maxRedemptionPerUser Int? @map("max_redemption_per_user")

  // 系統欄位
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // 關聯
  redeemedRewards RedeemedReward[]

  @@map("rewards")
  @@index([type])
  @@index([category])
  @@index([createdById])
  @@index([isActive])
}

enum RewardType {
  SYSTEM  // 系統預設
  CUSTOM  // 子女自訂
}

enum RewardCategory {
  BADGE      // 徽章
  TITLE      // 稱號
  GIFT       // 虛擬禮物
  COUPON     // 優惠券（未來擴展）
}
```

**欄位說明**：
- `name`：獎項名稱（如「運動達人徽章」）
- `description`：獎項描述
- `iconUrl`：圖示 URL（儲存於 S3）
- `pointsCost`：所需點數
- `type`：系統預設或自訂
- `category`：獎項類別
- `createdById`：創建者 ID（自訂獎項才有）
- `stock`：庫存數量（null 表示無限）
- `maxRedemptionPerUser`：每人兌換上限

**預設獎項範例**：
```sql
INSERT INTO rewards (id, name, description, icon_url, points_cost, type, category) VALUES
  ('...', '運動新手徽章', '完成第一次運動', 'badges/beginner.png', 0, 'SYSTEM', 'BADGE'),
  ('...', '運動達人稱號', '累積運動 100 次', 'titles/master.png', 1000, 'SYSTEM', 'TITLE'),
  ('...', '健康之星徽章', '連續運動 30 天', 'badges/health_star.png', 500, 'SYSTEM', 'BADGE');
```

---

### 6. RedeemedReward（已兌換獎項表）

儲存長輩已兌換的獎項記錄。

```prisma
model RedeemedReward {
  // 主鍵
  id        String   @id @default(uuid())

  // 關聯
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  rewardId  String   @map("reward_id")
  reward    Reward   @relation(fields: [rewardId], references: [id], onDelete: Cascade)

  // 兌換資訊
  pointsSpent Int    @map("points_spent")
  redeemedAt DateTime @default(now()) @map("redeemed_at")

  @@map("redeemed_rewards")
  @@index([userId])
  @@index([rewardId])
  @@index([redeemedAt])
}
```

---

### 7. Achievement（成就表）

儲存系統預設的成就定義。

```prisma
model Achievement {
  // 主鍵
  id          String   @id @default(uuid())

  // 基本資訊
  name        String
  description String
  iconUrl     String   @map("icon_url")

  // 解鎖條件
  conditionType AchievementCondition @map("condition_type")
  conditionValue Int              @map("condition_value")

  // 獎勵
  pointsReward Int     @map("points_reward")

  // 系統欄位
  createdAt   DateTime @default(now()) @map("created_at")

  // 關聯
  userAchievements UserAchievement[]

  @@map("achievements")
  @@index([conditionType])
}

enum AchievementCondition {
  FIRST_EXERCISE         // 首次運動
  CONSECUTIVE_DAYS       // 連續運動 N 天
  TOTAL_EXERCISES        // 累積運動 N 次
  TOTAL_DURATION_HOURS   // 累積運動 N 小時
  REDEEM_REWARD          // 首次兌換獎項
}
```

**預設成就範例**：
```sql
INSERT INTO achievements (id, name, description, icon_url, condition_type, condition_value, points_reward) VALUES
  ('...', '運動起步', '完成第一次運動', 'achievements/first.png', 'FIRST_EXERCISE', 1, 50),
  ('...', '持之以恆', '連續運動 7 天', 'achievements/7days.png', 'CONSECUTIVE_DAYS', 7, 200),
  ('...', '運動百鍊', '累積運動 100 次', 'achievements/100times.png', 'TOTAL_EXERCISES', 100, 500);
```

---

### 8. UserAchievement（用戶成就表）

儲存長輩已解鎖的成就。

```prisma
model UserAchievement {
  // 主鍵
  id            String   @id @default(uuid())

  // 關聯
  userId        String   @map("user_id")
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  achievementId String   @map("achievement_id")
  achievement   Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)

  // 解鎖資訊
  unlockedAt    DateTime @default(now()) @map("unlocked_at")
  notified      Boolean  @default(false) // 是否已推播通知

  @@map("user_achievements")
  @@unique([userId, achievementId])
  @@index([userId])
  @@index([achievementId])
  @@index([unlockedAt])
}
```

---

### 9. VoiceMessage（語音訊息表）

儲存子女錄製的鼓勵語音。

```prisma
model VoiceMessage {
  // 主鍵
  id          String   @id @default(uuid())

  // 關聯
  childId     String   @map("child_id")
  child       User     @relation("ChildVoiceMessages", fields: [childId], references: [id], onDelete: Cascade)

  elderId     String   @map("elder_id")
  elder       User     @relation("ElderVoiceMessages", fields: [elderId], references: [id], onDelete: Cascade)

  // 語音資訊
  fileUrl     String   @map("file_url")        // S3 URL
  fileName    String   @map("file_name")
  fileSize    Int      @map("file_size")       // bytes
  duration    Int                              // 秒數
  format      String   @default("aac")

  // 使用統計
  playCount   Int      @default(0) @map("play_count")
  lastPlayedAt DateTime? @map("last_played_at")

  // 系統欄位
  createdAt   DateTime @default(now()) @map("created_at")
  deletedAt   DateTime? @map("deleted_at")

  @@map("voice_messages")
  @@index([childId])
  @@index([elderId])
  @@index([createdAt])
}
```

**欄位說明**：
- `childId`：錄製者（子女）
- `elderId`：接收者（長輩）
- `fileUrl`：S3 儲存路徑
- `fileName`：原始檔名
- `fileSize`：檔案大小（bytes）
- `duration`：語音時長（秒）
- `playCount`：播放次數統計
- `lastPlayedAt`：最後播放時間

**限制檢查**：
```typescript
// 檢查語音數量限制（最多 20 段）
const count = await prisma.voiceMessage.count({
  where: {
    childId,
    elderId,
    deletedAt: null,
  }
});

if (count >= 20) {
  throw new Error('已達語音數量上限（20 段）');
}

// 檢查檔案大小（最大 5MB）
if (fileSize > 5 * 1024 * 1024) {
  throw new Error('語音檔案超過 5MB 限制');
}
```

---

### 10. DeviceToken（裝置 Token 表）

儲存用戶的 FCM 裝置 Token（支援多裝置）。

```prisma
model DeviceToken {
  // 主鍵
  id        String   @id @default(uuid())

  // 關聯
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Token 資訊
  token     String   @unique
  platform  Platform
  deviceId  String?  @map("device_id")
  deviceName String? @map("device_name")

  // 狀態
  isActive  Boolean  @default(true) @map("is_active")
  lastUsedAt DateTime @default(now()) @map("last_used_at")

  // 系統欄位
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("device_tokens")
  @@index([userId])
  @@index([token])
  @@index([isActive])
}

enum Platform {
  IOS
  ANDROID
  WEB
}
```

**欄位說明**：
- `userId`：用戶 ID
- `token`：FCM Token（唯一）
- `platform`：平台類型
- `deviceId`：裝置唯一識別碼
- `deviceName`：裝置名稱（如「iPhone 13」）
- `isActive`：是否啟用（失效的 token 會標記為 false）
- `lastUsedAt`：最後使用時間（用於清理過期 token）

---

## 資料庫遷移腳本（Prisma Schema）

完整的 Prisma Schema 檔案：

```prisma
// api/src/models/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// [以上所有 model 定義...]
```

## 資料完整性規則

### 1. 外鍵約束

所有外鍵使用 `onDelete: Cascade`，確保：
- 刪除用戶時，自動刪除相關的運動記錄、通知、語音等
- 刪除綁定關係時，不影響用戶資料

### 2. 唯一約束

- `User.email`：防止重複註冊
- `Binding(elderId, childId)`：防止重複綁定
- `DeviceToken.token`：防止 token 重複
- `Binding.inviteCode`：確保綁定碼唯一

### 3. 預設值

- `User.role`：無預設值，註冊時必須指定
- `User.totalPoints/currentPoints`：預設 0
- `ExerciseRecord.status`：預設 IN_PROGRESS
- `Notification.status`：預設 PENDING
- `Reward.isActive`：預設 true

### 4. 軟刪除

以下表格支援軟刪除（`deletedAt` 欄位）：
- `User`
- `Binding`
- `VoiceMessage`

查詢時需過濾 `deletedAt IS NULL`。

---

## 索引策略

### 1. 主要索引

- **User**：
  - `email`（登入查詢）
  - `role`（角色篩選）
  - `lastActiveAt`（活躍度檢查）

- **ExerciseRecord**：
  - `elderId`（查詢特定長輩記錄）
  - `startTime`（時間範圍查詢）
  - `status`（篩選進行中）

- **Notification**：
  - `recipientId`（查詢用戶通知）
  - `type`（通知類型統計）
  - `status`（待發送篩選）
  - `createdAt`（時間排序）

### 2. 複合索引（待效能測試後新增）

```sql
-- 查詢長輩在特定時間範圍的運動記錄
CREATE INDEX idx_exercise_elder_time ON exercise_records(elder_id, start_time DESC);

-- 查詢用戶未讀通知
CREATE INDEX idx_notification_unread ON notifications(recipient_id, read_at) WHERE read_at IS NULL;

-- 查詢已確認的綁定關係
CREATE INDEX idx_binding_confirmed ON bindings(elder_id, child_id) WHERE status = 'CONFIRMED';
```

---

## 資料庫效能優化

### 1. 連線池配置

```typescript
// api/src/config/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});

// 連線池設定（DATABASE_URL）
// postgresql://user:password@host:5432/dbname?
//   connection_limit=10&
//   pool_timeout=20&
//   connect_timeout=10
```

### 2. 查詢優化範例

```typescript
// 不佳：N+1 查詢問題
const users = await prisma.user.findMany({ where: { role: 'ELDER' } });
for (const user of users) {
  const records = await prisma.exerciseRecord.findMany({
    where: { elderId: user.id }
  });
}

// 優化：使用 include
const users = await prisma.user.findMany({
  where: { role: 'ELDER' },
  include: {
    exerciseRecords: {
      orderBy: { startTime: 'desc' },
      take: 10,
    }
  }
});
```

### 3. 批次操作

```typescript
// 批次插入通知
await prisma.notification.createMany({
  data: childIds.map(childId => ({
    senderId: elderId,
    recipientId: childId,
    type: 'EXERCISE_START',
    title: '運動開始',
    body: `${elderName} 開始運動了`,
  })),
  skipDuplicates: true,
});
```

---

## 資料備份策略

### 1. 自動備份

```bash
# 每日備份腳本
pg_dump -h localhost -U postgres -d fitness_app -F c -f backup_$(date +%Y%m%d).dump

# 保留 30 天備份
find /backup -name "backup_*.dump" -mtime +30 -delete
```

### 2. 時間點恢復（PITR）

使用 PostgreSQL 的 WAL (Write-Ahead Logging) 功能，啟用連續歸檔。

```postgresql
-- postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'
```

---

## 資料隱私與安全

### 1. 敏感資料加密

```typescript
// 加密電話號碼（選用）
import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function encryptPhone(phone: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(phone), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptPhone(encryptedPhone: string): string {
  const parts = encryptedPhone.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString();
}
```

### 2. 資料存取控制

```typescript
// Row Level Security (RLS) 範例
// 確保子女只能查看已綁定長輩的資料

async function getElderExerciseRecords(childId: string, elderId: string) {
  // 先驗證綁定關係
  const binding = await prisma.binding.findFirst({
    where: {
      childId,
      elderId,
      status: 'CONFIRMED',
      deletedAt: null,
    }
  });

  if (!binding) {
    throw new Error('無權查看此長輩資料');
  }

  // 查詢運動記錄
  return await prisma.exerciseRecord.findMany({
    where: { elderId },
    orderBy: { startTime: 'desc' },
  });
}
```

---

## 資料遷移指南

### 初始化資料庫

```bash
# 1. 安裝 Prisma CLI
npm install -D prisma

# 2. 初始化 Prisma
npx prisma init

# 3. 編輯 schema.prisma（複製上述完整 schema）

# 4. 生成遷移檔案
npx prisma migrate dev --name init

# 5. 套用遷移
npx prisma migrate deploy

# 6. 生成 Prisma Client
npx prisma generate
```

### 種子資料

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 建立系統預設獎項
  await prisma.reward.createMany({
    data: [
      {
        name: '運動新手徽章',
        description: '完成第一次運動',
        iconUrl: 'https://cdn.example.com/badges/beginner.png',
        pointsCost: 0,
        type: 'SYSTEM',
        category: 'BADGE',
      },
      // ... 更多預設獎項
    ],
  });

  // 建立系統預設成就
  await prisma.achievement.createMany({
    data: [
      {
        name: '運動起步',
        description: '完成第一次運動',
        iconUrl: 'https://cdn.example.com/achievements/first.png',
        conditionType: 'FIRST_EXERCISE',
        conditionValue: 1,
        pointsReward: 50,
      },
      // ... 更多預設成就
    ],
  });

  console.log('種子資料建立完成');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

執行種子腳本：
```bash
npx prisma db seed
```

---

## 總結

本資料模型設計涵蓋：
- ✅ 10 個核心資料表
- ✅ 完整的關聯關係（一對多、多對多）
- ✅ 索引策略（查詢優化）
- ✅ 資料完整性規則（外鍵、唯一約束）
- ✅ 軟刪除支援
- ✅ 效能優化建議
- ✅ 備份與安全策略
- ✅ Prisma ORM 完整 schema

下一步：撰寫 API 合約文件（contracts/ 目錄）
