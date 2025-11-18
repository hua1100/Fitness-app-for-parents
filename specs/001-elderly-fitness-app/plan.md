# 實施計劃：長輩運動關懷應用程式

分支：001-elderly-fitness-app | 日期：2025-11-18 | 規格：[spec.md](./spec.md)

輸入：功能規格來自 /specs/001-elderly-fitness-app/spec.md

## 摘要

本專案旨在開發一個跨平台移動應用程式，讓長輩能夠記錄運動打卡，子女能夠即時監控長輩的運動狀況。核心功能包括：運動打卡記錄、即時推播通知、緊急求助、點數獎勵系統、以及客製化語音激勵。系統採用前後端分離架構，支援離線運作和自動同步。

**技術方案**：
- **前端**：React Native（跨平台移動應用）
- **後端**：Node.js + Express + TypeScript
- **資料庫**：PostgreSQL（關聯式資料）
- **推播通知**：Firebase Cloud Messaging (FCM)
- **檔案儲存**：AWS S3（語音檔案）
- **離線支援**：AsyncStorage + SQLite
- **即時通訊**：Socket.io（緊急求助即時警報）

## 技術背景

### 技術棧詳細資訊

**語言/版本**：
- 前端：React Native 0.73+, TypeScript 5.3+
- 後端：Node.js 20 LTS, TypeScript 5.3+
- 資料庫：PostgreSQL 16

**主要依賴**：
- **移動端**：
  - React Native (框架)
  - React Navigation (路由)
  - Redux Toolkit + RTK Query (狀態管理和 API 快取)
  - React Native Firebase (推播通知)
  - React Native Voice (語音錄製)
  - React Native Sound (語音播放)
  - AsyncStorage (本地儲存)
  - SQLite (離線資料庫)
  - Socket.io-client (WebSocket 連線)
  - React Native Geolocation (位置服務)
  - Victory Native (統計圖表)

- **後端**：
  - Express.js (Web 框架)
  - TypeScript (型別安全)
  - Prisma ORM (資料庫 ORM)
  - Socket.io (WebSocket 伺服器)
  - Firebase Admin SDK (推播通知)
  - AWS SDK (S3 檔案上傳)
  - Node-cron (定時任務)
  - JWT (身份驗證)
  - Bcrypt (密碼加密)
  - Zod (資料驗證)

**儲存**：
- PostgreSQL（主要資料庫）
- AWS S3（語音檔案儲存）
- Redis（快取和工作佇列，選用）
- SQLite（移動端離線資料庫）

**測試**：
- 前端：Jest + React Native Testing Library
- 後端：Jest + Supertest
- E2E：Detox (選用)

**目標平台**：
- iOS 14.0+
- Android 8.0+ (API Level 26+)
- 後端：Linux server (Ubuntu 22.04 LTS)

**專案類型**：Mobile + API (選項 3)

**效能目標**：
- App 啟動時間：< 3 秒 (中階手機)
- 推播通知延遲：< 30 秒 (一般運動通知)
- 緊急警報延遲：< 10 秒
- 資料同步時間：< 1 分鐘 (網路恢復後)
- 列表載入時間：< 2 秒 (100 筆記錄)
- 語音上傳時間：< 10 秒 (5MB, 4G 網路)

**限制條件**：
- 單一語音檔案：≤ 5MB
- 語音數量上限：20 段/用戶
- 每日點數上限：100 點
- 綁定子女上限：5 個/長輩
- 推播通知送達率：≥ 95%
- 離線資料保留：7 天
- 緊急警報二次確認時間：3 秒長按
- 誤發警報取消時限：30 秒

**規模/範疇**：
- 預期用戶：10,000 長輩用戶，20,000 子女用戶（初期）
- 每日活躍用戶：3,000 (30% DAU)
- 每日運動記錄：5,000 筆
- 每日推播通知：15,000 則
- 資料庫記錄：500,000 筆運動記錄（首年）
- 語音檔案儲存：100GB（首年）

## 憲章合規性檢查

**檢查點**：必須在 Phase 0 研究前通過。Phase 1 設計後重新檢查。

### 憲章原則檢查

✅ **原則 1（文檔語言標準）**：本文件及所有後續文檔（research.md, data-model.md, quickstart.md, tasks.md）使用繁體中文撰寫

✅ **原則 2（簡單優先）**：
- 初期採用單體後端架構（避免微服務複雜度）
- 使用 ORM（Prisma）簡化資料庫操作
- React Native 統一前端技術棧（避免 iOS/Android 雙重開發）
- 複雜度追蹤：見下方「複雜度追蹤」表格

✅ **原則 3（測試驅動驗證）**：
- spec.md 已包含 17 個可測試的驗收場景
- 測試策略：先寫合約測試和整合測試，確保失敗後再實作
- 每個 API 端點都有對應的測試案例

✅ **原則 4（獨立用戶故事）**：
- P1（運動打卡與監控）：獨立可交付的 MVP，包含核心價值
- P2（獎項系統）：可獨立測試，不依賴 P3
- P3（語音激勵）：可獨立測試，不影響 P1/P2 運作
- 每個故事都有明確的獨立測試方法

✅ **原則 5（憲章合規性檢查）**：
- 本檢查在 Phase 0 前完成 ✓
- 將在 Phase 1 設計完成後重新檢查

✅ **原則 6（明確勝於隱含）**：
- 所有技術選型都有明確說明
- 效能目標數值化（非模糊描述）
- 無「NEEDS CLARIFICATION」標記（所有需求已明確）

✅ **原則 7（語意化版本控制）**：
- N/A（適用於憲章修訂，不適用於實施計劃）

### 違規項目

**無違規** - 所有憲章原則均已遵守

## 專案結構

### 文檔結構（此功能）

```
specs/001-elderly-fitness-app/
├── plan.md              # 本檔案（實施計劃）
├── spec.md              # 功能規格（已完成）
├── research.md          # Phase 0 輸出（待建立）
├── data-model.md        # Phase 1 輸出（待建立）
├── quickstart.md        # Phase 1 輸出（待建立）
├── contracts/           # Phase 1 輸出（待建立）
│   ├── auth.md         # 認證相關 API
│   ├── exercise.md     # 運動記錄 API
│   ├── notification.md # 通知 API
│   ├── reward.md       # 獎項系統 API
│   └── voice.md        # 語音管理 API
└── tasks.md             # Phase 2 輸出（由 /speckit.tasks 生成）
```

### 原始碼結構（倉庫根目錄）

本專案屬於 **選項 3：Mobile + API** 架構

```
fitness-app-for-parents/
├── api/                           # 後端 API 服務
│   ├── src/
│   │   ├── config/               # 配置檔案
│   │   │   ├── database.ts      # 資料庫連線配置
│   │   │   ├── firebase.ts      # Firebase 配置
│   │   │   └── aws.ts           # AWS S3 配置
│   │   ├── models/               # Prisma 資料模型
│   │   │   └── schema.prisma    # 資料庫 schema
│   │   ├── controllers/          # 控制器
│   │   │   ├── auth.controller.ts
│   │   │   ├── exercise.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── reward.controller.ts
│   │   │   └── voice.controller.ts
│   │   ├── services/             # 業務邏輯
│   │   │   ├── auth.service.ts
│   │   │   ├── exercise.service.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── reward.service.ts
│   │   │   ├── voice.service.ts
│   │   │   └── cron.service.ts  # 定時任務
│   │   ├── middlewares/          # 中介軟體
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── routes/               # 路由定義
│   │   │   ├── auth.routes.ts
│   │   │   ├── exercise.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   ├── reward.routes.ts
│   │   │   └── voice.routes.ts
│   │   ├── utils/                # 工具函數
│   │   │   ├── jwt.util.ts
│   │   │   ├── s3.util.ts
│   │   │   └── fcm.util.ts
│   │   ├── websocket/            # WebSocket 處理
│   │   │   └── emergency.handler.ts
│   │   └── index.ts              # 應用程式入口
│   ├── tests/                    # 後端測試
│   │   ├── contract/            # 合約測試
│   │   ├── integration/         # 整合測試
│   │   └── unit/                # 單元測試
│   ├── prisma/                  # Prisma 遷移
│   │   └── migrations/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── mobile/                       # React Native 移動應用
│   ├── src/
│   │   ├── components/          # 共用元件
│   │   │   ├── common/         # 通用元件
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   └── Loading.tsx
│   │   │   ├── elder/          # 長輩專用元件
│   │   │   │   ├── ExerciseButton.tsx
│   │   │   │   ├── EmergencyButton.tsx
│   │   │   │   └── StatisticsCard.tsx
│   │   │   └── child/          # 子女專用元件
│   │   │       ├── ElderStatusCard.tsx
│   │   │       ├── VoiceRecorder.tsx
│   │   │       └── RewardEditor.tsx
│   │   ├── screens/             # 頁面
│   │   │   ├── auth/           # 認證相關
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   ├── RegisterScreen.tsx
│   │   │   │   └── RoleSelectScreen.tsx
│   │   │   ├── elder/          # 長輩端頁面
│   │   │   │   ├── HomeScreen.tsx
│   │   │   │   ├── ExerciseScreen.tsx
│   │   │   │   ├── HistoryScreen.tsx
│   │   │   │   ├── RewardShopScreen.tsx
│   │   │   │   └── ProfileScreen.tsx
│   │   │   └── child/          # 子女端頁面
│   │   │       ├── DashboardScreen.tsx
│   │   │       ├── ElderDetailScreen.tsx
│   │   │       ├── VoiceManageScreen.tsx
│   │   │       ├── RewardManageScreen.tsx
│   │   │       └── ProfileScreen.tsx
│   │   ├── navigation/          # 導航配置
│   │   │   ├── AuthNavigator.tsx
│   │   │   ├── ElderNavigator.tsx
│   │   │   ├── ChildNavigator.tsx
│   │   │   └── RootNavigator.tsx
│   │   ├── store/               # Redux 狀態管理
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── exerciseSlice.ts
│   │   │   │   ├── rewardSlice.ts
│   │   │   │   └── voiceSlice.ts
│   │   │   ├── api/            # RTK Query API
│   │   │   │   ├── authApi.ts
│   │   │   │   ├── exerciseApi.ts
│   │   │   │   ├── rewardApi.ts
│   │   │   │   └── voiceApi.ts
│   │   │   └── index.ts
│   │   ├── services/            # 本地服務
│   │   │   ├── storage.service.ts      # AsyncStorage
│   │   │   ├── database.service.ts     # SQLite
│   │   │   ├── sync.service.ts         # 離線同步
│   │   │   ├── notification.service.ts # FCM
│   │   │   ├── voice.service.ts        # 語音錄製/播放
│   │   │   ├── location.service.ts     # 定位服務
│   │   │   └── websocket.service.ts    # WebSocket 連線
│   │   ├── utils/               # 工具函數
│   │   │   ├── validation.ts
│   │   │   ├── date.ts
│   │   │   └── audio.ts
│   │   ├── constants/           # 常數定義
│   │   │   ├── colors.ts
│   │   │   ├── strings.ts
│   │   │   └── config.ts
│   │   ├── types/               # TypeScript 類型
│   │   │   ├── user.types.ts
│   │   │   ├── exercise.types.ts
│   │   │   └── reward.types.ts
│   │   └── App.tsx              # 應用程式入口
│   ├── android/                 # Android 原生代碼
│   ├── ios/                     # iOS 原生代碼
│   ├── tests/                   # 前端測試
│   │   ├── components/
│   │   ├── screens/
│   │   └── integration/
│   ├── package.json
│   ├── tsconfig.json
│   ├── metro.config.js
│   └── .env.example
│
├── shared/                       # 前後端共用代碼（選用）
│   ├── types/                   # 共用型別定義
│   └── constants/               # 共用常數
│
├── docs/                         # 專案文檔
│   ├── api/                     # API 文檔
│   ├── deployment/              # 部署指南
│   └── architecture/            # 架構說明
│
├── .github/                      # GitHub 配置
│   └── workflows/               # CI/CD
│
├── README.md                     # 專案說明
└── .gitignore
```

**結構決策**：

本專案採用 **選項 3：Mobile + API** 架構，原因如下：

1. **明確的職責分離**：前端（移動應用）和後端（API 服務）各自獨立，便於團隊分工
2. **跨平台支援**：React Native 同時支援 iOS 和 Android，減少重複開發
3. **可擴展性**：未來可輕鬆新增 Web 端或其他客戶端
4. **技術棧一致性**：前後端均使用 TypeScript，便於代碼共享和維護
5. **獨立部署**：API 服務和移動應用可獨立更新和部署

## 複雜度追蹤

僅在憲章合規性檢查有違規時填寫。

| 違規項目 | 為何需要 | 為何拒絕更簡單的替代方案 |
|---------|---------|---------------------|
| 無違規 | N/A | N/A |

**說明**：本實施計劃遵循「簡單優先」原則：
- 採用成熟穩定的技術棧（React Native, Node.js, PostgreSQL）
- 避免過度設計（無微服務、無複雜的快取策略）
- ORM 簡化資料庫操作
- 使用第三方服務（Firebase FCM, AWS S3）而非自建基礎設施

## 開發階段

### Phase 0：技術研究（research.md）
- 研究 React Native 離線同步最佳實踐
- 研究 Firebase FCM 推播通知配置
- 研究語音錄製和壓縮方案
- 研究 WebSocket 即時通訊實作
- 研究長輩友善的 UI/UX 設計模式
- 輸出：research.md

### Phase 1：架構設計
- 設計資料庫 schema（data-model.md）
- 設計 RESTful API 合約（contracts/ 目錄）
- 設計離線同步策略
- 設計推播通知架構
- 設計語音檔案儲存和播放流程
- 撰寫快速啟動指南（quickstart.md）
- **重新執行憲章合規性檢查**

### Phase 2：任務拆解（tasks.md）
- 使用 /speckit.tasks 命令生成詳細任務列表
- 按用戶故事組織任務（US1, US2, US3）
- 標記可並行執行的任務
- 確保每個任務都有明確的檔案路徑

## 後續步驟

1. ✅ 完成 spec.md（已完成）
2. ✅ 完成 plan.md（本檔案）
3. ⏳ 建立 research.md（Phase 0 研究）
4. ⏳ 建立 data-model.md（Phase 1 設計）
5. ⏳ 建立 contracts/ API 合約（Phase 1 設計）
6. ⏳ 建立 quickstart.md（Phase 1 設計）
7. ⏳ 使用 /speckit.tasks 生成 tasks.md（Phase 2）
8. ⏳ 開始實作（依據 tasks.md 執行）

## 風險與緩解措施

### 技術風險

**R1：推播通知送達率不穩定**
- **風險等級**：高
- **影響**：子女無法即時收到長輩的運動通知或緊急警報
- **緩解措施**：
  - 使用 Firebase FCM（高可靠性）
  - 實作通知佇列和重試機制
  - 提供 App 內通知作為備援
  - 記錄通知發送日誌，監控送達率

**R2：離線同步資料衝突**
- **風險等級**：中
- **影響**：網路恢復後資料同步可能失敗或覆蓋
- **緩解措施**：
  - 使用時間戳記和版本號控制
  - 採用「最後寫入優先」策略（適用於運動記錄）
  - 關鍵資料（如緊急警報）優先同步
  - 提供衝突解決 UI（僅在必要時）

**R3：語音檔案過大影響上傳效能**
- **風險等級**：中
- **影響**：語音上傳時間過長，影響使用體驗
- **緩解措施**：
  - 限制錄音時長（最長 30 秒）
  - 使用 AAC 格式壓縮（比 MP3 更高效）
  - 前端先壓縮再上傳
  - 顯示上傳進度條
  - 支援斷點續傳

**R4：長輩使用障礙**
- **風險等級**：高
- **影響**：目標用戶無法順利使用 app
- **緩解措施**：
  - 大字體、高對比度 UI 設計
  - 簡化操作流程（首頁一鍵開始運動）
  - 語音提示和操作引導
  - 提供教學影片和圖文指南
  - 子女可遠端協助設定

### 專案風險

**R5：開發時程延誤**
- **風險等級**：中
- **影響**：無法按時交付 MVP
- **緩解措施**：
  - 採用獨立用戶故事（P1 可優先交付）
  - 每週檢視進度
  - P2 和 P3 可視情況延後
  - 準備降級方案（如 P3 語音功能可先不做）

**R6：第三方服務依賴**
- **風險等級**：低
- **影響**：Firebase 或 AWS 服務中斷影響功能
- **緩解措施**：
  - 選擇高 SLA 服務方案
  - 實作降級邏輯（如推播失敗改用輪詢）
  - 重要資料多地備份
  - 監控第三方服務狀態

## 效能優化策略

1. **App 啟動優化**
   - 延遲載入非關鍵模組
   - 使用 Hermes JavaScript 引擎（Android）
   - 優化啟動畫面資源

2. **列表渲染優化**
   - 使用 FlatList 虛擬化列表
   - 分頁載入（每頁 20 筆）
   - 實作下拉刷新和上拉載入

3. **圖片和語音優化**
   - 圖片懶載入
   - 語音檔案預載入（運動開始前）
   - 使用 CDN 加速（如 CloudFront）

4. **API 優化**
   - 資料庫查詢索引
   - API 回應快取（Redis）
   - 批次處理推播通知

5. **網路優化**
   - HTTP/2 支援
   - Gzip 壓縮
   - GraphQL（選用，減少 over-fetching）

## 安全性考量

1. **身份驗證**
   - JWT Token（15 分鐘過期）
   - Refresh Token（7 天過期）
   - 多裝置登入控制

2. **資料加密**
   - HTTPS/TLS 傳輸加密
   - 敏感資料欄位加密（如電話號碼）
   - 密碼使用 Bcrypt 雜湊

3. **API 安全**
   - 速率限制（Rate Limiting）
   - CORS 配置
   - 輸入驗證和消毒

4. **隱私保護**
   - 位置資訊僅在緊急求助時傳送
   - 語音檔案訪問權限控制
   - 用戶資料刪除功能（符合 GDPR）

5. **推播通知安全**
   - FCM Token 定期輪換
   - 通知內容不包含敏感資訊
   - 裝置綁定驗證

## 測試策略

### 後端測試
- **單元測試**：每個 service 和 controller 都有對應測試（覆蓋率 ≥ 80%）
- **整合測試**：測試 API 端點和資料庫互動
- **合約測試**：驗證 API 回應符合合約規範

### 前端測試
- **元件測試**：測試共用元件的渲染和互動
- **整合測試**：測試頁面流程（如登入 → 開始運動 → 結束運動）
- **E2E 測試**：使用 Detox 測試完整用戶旅程（選用）

### 測試數據
- 建立測試帳號（長輩和子女）
- 模擬運動記錄和通知
- 測試語音檔案（各種格式和大小）

### 效能測試
- 使用 Lighthouse 測試 app 啟動時間
- 使用 Artillery 測試 API 負載（1000 併發請求）
- 測試離線同步場景

## 部署計劃

### 開發環境
- 本地開發（localhost）
- 開發資料庫（PostgreSQL Docker）
- Firebase 測試專案
- AWS S3 測試 bucket

### 測試環境
- Staging API 伺服器
- 測試資料庫（與生產隔離）
- TestFlight (iOS) / Internal Testing (Android)

### 生產環境
- AWS EC2 或 GCP Compute Engine（API 伺服器）
- RDS PostgreSQL（生產資料庫）
- Firebase 生產專案
- AWS S3 生產 bucket
- CloudFront CDN（語音檔案分發）
- App Store 和 Google Play 上架

### CI/CD
- GitHub Actions 自動化測試
- 自動化部署（Staging）
- 手動審核後部署（Production）

## 監控與維運

1. **應用程式監控**
   - Sentry（錯誤追蹤）
   - Firebase Analytics（使用者行為）
   - 自訂儀表板（運動次數、通知送達率）

2. **伺服器監控**
   - AWS CloudWatch（伺服器效能）
   - 資料庫查詢效能監控
   - API 回應時間監控

3. **告警機制**
   - 推播通知送達率 < 95% 告警
   - API 錯誤率 > 1% 告警
   - 資料庫連線失敗告警
   - 磁碟空間不足告警

4. **日誌管理**
   - 集中式日誌收集（ELK Stack 或 CloudWatch Logs）
   - 保留 30 天日誌
   - 敏感資訊遮罩

## 專案時程預估

- **Phase 0（研究）**：1 週
- **Phase 1（設計）**：1 週
- **Phase 2（任務拆解）**：0.5 週
- **P1 實作（核心 MVP）**：4-6 週
- **P2 實作（獎項系統）**：2-3 週
- **P3 實作（語音功能）**：2-3 週
- **測試與修復**：2 週
- **上架準備**：1 週

**總計**：約 3-4 個月（全職開發）

**里程碑**：
- M1：完成架構設計和 API 合約（2 週）
- M2：完成 P1 MVP 並可測試（6 週）
- M3：完成 P2 獎項系統（9 週）
- M4：完成 P3 語音功能（12 週）
- M5：測試完成並上架（14 週）
