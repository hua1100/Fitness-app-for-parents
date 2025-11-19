# 任務列表：長輩運動關懷應用程式

輸入：設計文檔來自 /specs/001-elderly-fitness-app/
前置條件：plan.md（必要）、spec.md（必要）、research.md、data-model.md、contracts/

## 格式說明

- **[P]**：可並行執行（不同檔案、無依賴）
- **[US1/US2/US3]**：所屬用戶故事
- 每個任務包含完整檔案路徑

## 路徑慣例

本專案採用 **Mobile + API** 架構：
- 後端：`api/src/`、`api/tests/`
- 移動端：`mobile/src/`、`mobile/tests/`

---

## Phase 1：專案設定（共用基礎設施）

目的：專案初始化和基本結構建立

- T001 依據實施計劃建立專案目錄結構（api/ 和 mobile/）
- T002 初始化後端 Node.js 專案，安裝 Express、TypeScript、Prisma 依賴於 `api/package.json`
- T003 [P] 初始化 React Native 專案，安裝核心依賴於 `mobile/package.json`
- T004 [P] 配置後端 ESLint、Prettier 和 TypeScript 於 `api/tsconfig.json`、`api/.eslintrc.js`
- T005 [P] 配置移動端 ESLint、Prettier 和 TypeScript 於 `mobile/tsconfig.json`、`mobile/.eslintrc.js`
- T006 [P] 建立後端環境變數範本 `api/.env.example`
- T007 [P] 建立移動端環境變數範本 `mobile/.env.example`
- T008 建立 Docker Compose 配置（PostgreSQL、Redis）於 `docker-compose.yml`
- T009 設定 GitHub Actions CI/CD 工作流程於 `.github/workflows/ci.yml`

**檢查點**：專案結構就緒，可以開始基礎開發

---

## Phase 2：基礎建設（阻塞性前置條件）

目的：必須在任何用戶故事開始前完成的核心基礎設施

⚠️ **重要**：所有用戶故事開發必須等此階段完成

### 2.1 資料庫設定

- T010 建立 Prisma Schema 定義所有資料模型於 `api/src/models/schema.prisma`
- T011 執行資料庫初始遷移 `npx prisma migrate dev --name init`
- T012 建立種子資料腳本（預設獎項、成就）於 `api/prisma/seed.ts`
- T013 生成 Prisma Client `npx prisma generate`

### 2.2 後端核心架構

- T014 建立 Express 應用程式入口於 `api/src/index.ts`
- T015 [P] 配置資料庫連線於 `api/src/config/database.ts`
- T016 [P] 配置 Firebase Admin SDK 於 `api/src/config/firebase.ts`
- T017 [P] 配置 AWS S3 於 `api/src/config/aws.ts`
- T018 建立 JWT 工具函數（生成、驗證）於 `api/src/utils/jwt.util.ts`
- T019 [P] 建立 FCM 推播通知工具於 `api/src/utils/fcm.util.ts`
- T020 [P] 建立 S3 檔案上傳工具於 `api/src/utils/s3.util.ts`
- T021 建立認證中介軟體於 `api/src/middlewares/auth.middleware.ts`
- T022 [P] 建立錯誤處理中介軟體於 `api/src/middlewares/error.middleware.ts`
- T023 [P] 建立資料驗證中介軟體（Zod）於 `api/src/middlewares/validation.middleware.ts`
- T024 建立 WebSocket 伺服器設定於 `api/src/websocket/index.ts`

### 2.3 移動端核心架構

- T025 建立 Redux Store 配置於 `mobile/src/store/index.ts`
- T026 [P] 建立 RTK Query API 基礎配置於 `mobile/src/store/api/baseApi.ts`
- T027 [P] 建立導航器根配置於 `mobile/src/navigation/RootNavigator.tsx`
- T028 [P] 建立認證導航器於 `mobile/src/navigation/AuthNavigator.tsx`
- T029 建立本地儲存服務（AsyncStorage）於 `mobile/src/services/storage.service.ts`
- T030 [P] 建立 SQLite 離線資料庫服務於 `mobile/src/services/database.service.ts`
- T031 [P] 建立網路狀態監聽服務於 `mobile/src/services/network.service.ts`
- T032 建立同步服務（離線資料同步）於 `mobile/src/services/sync.service.ts`
- T033 [P] 建立 FCM 推播通知服務於 `mobile/src/services/notification.service.ts`
- T034 建立 WebSocket 連線服務於 `mobile/src/services/websocket.service.ts`
- T035 [P] 建立常數定義（顏色、字串）於 `mobile/src/constants/`
- T036 [P] 建立共用 TypeScript 類型於 `mobile/src/types/`

### 2.4 共用元件

- T037 [P] 建立大按鈕元件於 `mobile/src/components/common/Button.tsx`
- T038 [P] 建立輸入框元件於 `mobile/src/components/common/Input.tsx`
- T039 [P] 建立卡片元件於 `mobile/src/components/common/Card.tsx`
- T040 [P] 建立載入指示器元件於 `mobile/src/components/common/Loading.tsx`
- T041 [P] 建立錯誤訊息元件於 `mobile/src/components/common/ErrorMessage.tsx`
- T042 [P] 建立確認對話框元件於 `mobile/src/components/common/ConfirmDialog.tsx`

**檢查點**：基礎建設就緒，用戶故事可以開始並行開發

---

## Phase 3：用戶故事 1 - 長輩運動打卡與子女即時監控 (P1) 🎯 MVP

**目標**：長輩可以記錄運動、子女可以即時收到通知、緊急求助功能

**獨立測試**：長輩開始運動 → 子女收到通知 → 長輩結束運動 → 查看記錄 → 觸發緊急求助

### 3.1 認證系統

#### 後端實作

- T043 [P] [US1] 建立認證服務於 `api/src/services/auth.service.ts`
- T044 [P] [US1] 建立認證控制器於 `api/src/controllers/auth.controller.ts`
- T045 [US1] 建立認證路由於 `api/src/routes/auth.routes.ts`
- T046 [P] [US1] 實作註冊端點（POST /auth/register）
- T047 [P] [US1] 實作登入端點（POST /auth/login）
- T048 [P] [US1] 實作 Token 刷新端點（POST /auth/refresh）
- T049 [P] [US1] 實作登出端點（POST /auth/logout）
- T050 [P] [US1] 實作取得用戶資訊端點（GET /auth/me）
- T051 [P] [US1] 實作更新用戶資料端點（PATCH /auth/me）
- T052 [P] [US1] 實作裝置 Token 註冊端點（POST /auth/device-token）

#### 移動端實作

- T053 [P] [US1] 建立認證 API（RTK Query）於 `mobile/src/store/api/authApi.ts`
- T054 [P] [US1] 建立認證狀態切片於 `mobile/src/store/slices/authSlice.ts`
- T055 [P] [US1] 建立登入頁面於 `mobile/src/screens/auth/LoginScreen.tsx`
- T056 [P] [US1] 建立註冊頁面於 `mobile/src/screens/auth/RegisterScreen.tsx`
- T057 [P] [US1] 建立角色選擇頁面於 `mobile/src/screens/auth/RoleSelectScreen.tsx`
- T058 [US1] 實作自動登入（Token 持久化）邏輯

### 3.2 帳號綁定系統

#### 後端實作

- T059 [P] [US1] 建立綁定服務於 `api/src/services/binding.service.ts`
- T060 [P] [US1] 建立綁定控制器於 `api/src/controllers/binding.controller.ts`
- T061 [US1] 建立綁定路由於 `api/src/routes/binding.routes.ts`
- T062 [P] [US1] 實作生成綁定碼端點（POST /binding/generate-code）
- T063 [P] [US1] 實作使用綁定碼端點（POST /binding/use-code）
- T064 [P] [US1] 實作確認綁定端點（POST /binding/confirm）
- T065 [P] [US1] 實作取得綁定列表端點（GET /binding）
- T066 [P] [US1] 實作解除綁定端點（DELETE /binding/:bindingId）

#### 移動端實作

- T067 [P] [US1] 建立綁定 API 於 `mobile/src/store/api/bindingApi.ts`
- T068 [P] [US1] 建立綁定狀態切片於 `mobile/src/store/slices/bindingSlice.ts`
- T069 [P] [US1] 建立綁定碼生成頁面（長輩端）於 `mobile/src/screens/elder/BindingCodeScreen.tsx`
- T070 [P] [US1] 建立輸入綁定碼頁面（子女端）於 `mobile/src/screens/child/EnterBindingCodeScreen.tsx`
- T071 [P] [US1] 建立綁定列表元件於 `mobile/src/components/common/BindingList.tsx`

### 3.3 運動記錄系統

#### 後端實作

- T072 [P] [US1] 建立運動服務於 `api/src/services/exercise.service.ts`
- T073 [P] [US1] 建立運動控制器於 `api/src/controllers/exercise.controller.ts`
- T074 [US1] 建立運動路由於 `api/src/routes/exercise.routes.ts`
- T075 [P] [US1] 實作開始運動端點（POST /exercise/start）
- T076 [P] [US1] 實作結束運動端點（POST /exercise/end）
- T077 [P] [US1] 實作運動記錄列表端點（GET /exercise）
- T078 [P] [US1] 實作運動統計端點（GET /exercise/stats）
- T079 [P] [US1] 實作進行中運動查詢端點（GET /exercise/current）
- T080 [US1] 實作點數計算邏輯（每日上限 100 點）

#### 移動端實作

- T081 [P] [US1] 建立運動 API 於 `mobile/src/store/api/exerciseApi.ts`
- T082 [P] [US1] 建立運動狀態切片於 `mobile/src/store/slices/exerciseSlice.ts`
- T083 [P] [US1] 建立運動按鈕元件（大圓形按鈕）於 `mobile/src/components/elder/ExerciseButton.tsx`
- T084 [P] [US1] 建立長輩首頁於 `mobile/src/screens/elder/HomeScreen.tsx`
- T085 [P] [US1] 建立運動進行中頁面於 `mobile/src/screens/elder/ExerciseScreen.tsx`
- T086 [P] [US1] 建立運動記錄列表頁面於 `mobile/src/screens/elder/HistoryScreen.tsx`
- T087 [P] [US1] 建立運動統計元件（圖表）於 `mobile/src/components/elder/StatisticsCard.tsx`
- T088 [US1] 建立長輩導航器於 `mobile/src/navigation/ElderNavigator.tsx`

### 3.4 子女監控系統

#### 後端實作

- T089 [P] [US1] 建立通知服務於 `api/src/services/notification.service.ts`
- T090 [P] [US1] 建立通知控制器於 `api/src/controllers/notification.controller.ts`
- T091 [US1] 建立通知路由於 `api/src/routes/notification.routes.ts`
- T092 [P] [US1] 實作通知列表端點（GET /notifications）
- T093 [P] [US1] 實作標記已讀端點（POST /notifications/mark-read）
- T094 [P] [US1] 實作未讀數量端點（GET /notifications/unread-count）
- T095 [US1] 實作運動開始時推播通知邏輯
- T096 [US1] 建立定時任務服務於 `api/src/services/cron.service.ts`
- T097 [US1] 實作每日活躍度檢查（3 天未開啟通知）

#### 移動端實作

- T098 [P] [US1] 建立通知 API 於 `mobile/src/store/api/notificationApi.ts`
- T099 [P] [US1] 建立通知狀態切片於 `mobile/src/store/slices/notificationSlice.ts`
- T100 [P] [US1] 建立子女首頁（儀表板）於 `mobile/src/screens/child/DashboardScreen.tsx`
- T101 [P] [US1] 建立長輩狀態卡片元件於 `mobile/src/components/child/ElderStatusCard.tsx`
- T102 [P] [US1] 建立長輩詳情頁面於 `mobile/src/screens/child/ElderDetailScreen.tsx`
- T103 [P] [US1] 建立通知列表頁面於 `mobile/src/screens/common/NotificationScreen.tsx`
- T104 [US1] 建立子女導航器於 `mobile/src/navigation/ChildNavigator.tsx`

### 3.5 緊急求助系統

#### 後端實作

- T105 [P] [US1] 實作緊急求助端點（POST /exercise/emergency）
- T106 [P] [US1] 實作取消緊急求助端點（POST /exercise/emergency/cancel）
- T107 [US1] 建立緊急求助 WebSocket 處理器於 `api/src/websocket/emergency.handler.ts`
- T108 [US1] 實作緊急求助即時推送（WebSocket + FCM）

#### 移動端實作

- T109 [P] [US1] 建立緊急求助按鈕元件於 `mobile/src/components/elder/EmergencyButton.tsx`
- T110 [P] [US1] 建立緊急警報彈窗元件於 `mobile/src/components/child/EmergencyAlert.tsx`
- T111 [P] [US1] 建立位置服務於 `mobile/src/services/location.service.ts`
- T112 [US1] 實作緊急求助 WebSocket 監聽

### 3.6 離線支援

- T113 [US1] 實作運動記錄本地儲存（SQLite）
- T114 [US1] 實作網路恢復後自動同步
- T115 [US1] 實作同步佇列管理（優先級排序）

**檢查點**：用戶故事 1 完成，MVP 可獨立測試和部署

---

## Phase 4：用戶故事 2 - 打卡兌換獎項激勵系統 (P2)

**目標**：長輩累積點數、兌換獎項、子女自訂獎項、成就系統

**獨立測試**：完成運動 → 獲得點數 → 查看商城 → 兌換獎項 → 解鎖成就

### 4.1 獎項系統後端

- T116 [P] [US2] 建立獎項服務於 `api/src/services/reward.service.ts`
- T117 [P] [US2] 建立獎項控制器於 `api/src/controllers/reward.controller.ts`
- T118 [US2] 建立獎項路由於 `api/src/routes/reward.routes.ts`
- T119 [P] [US2] 實作獎項列表端點（GET /rewards）
- T120 [P] [US2] 實作兌換獎項端點（POST /rewards/:rewardId/redeem）
- T121 [P] [US2] 實作已兌換獎項端點（GET /rewards/redeemed）
- T122 [P] [US2] 實作創建自訂獎項端點（POST /rewards）
- T123 [P] [US2] 實作更新自訂獎項端點（PATCH /rewards/:rewardId）
- T124 [P] [US2] 實作刪除自訂獎項端點（DELETE /rewards/:rewardId）

### 4.2 成就系統後端

- T125 [P] [US2] 建立成就服務於 `api/src/services/achievement.service.ts`
- T126 [P] [US2] 實作成就列表端點（GET /achievements）
- T127 [P] [US2] 實作已解鎖成就端點（GET /achievements/unlocked）
- T128 [P] [US2] 實作成就進度端點（GET /achievements/progress）
- T129 [US2] 實作成就檢測和解鎖邏輯（運動結束時觸發）
- T130 [US2] 實作成就解鎖通知推播

### 4.3 獎項系統移動端（長輩）

- T131 [P] [US2] 建立獎項 API 於 `mobile/src/store/api/rewardApi.ts`
- T132 [P] [US2] 建立獎項狀態切片於 `mobile/src/store/slices/rewardSlice.ts`
- T133 [P] [US2] 建立獎項商城頁面於 `mobile/src/screens/elder/RewardShopScreen.tsx`
- T134 [P] [US2] 建立獎項卡片元件於 `mobile/src/components/elder/RewardCard.tsx`
- T135 [P] [US2] 建立我的收藏頁面於 `mobile/src/screens/elder/MyRewardsScreen.tsx`
- T136 [P] [US2] 建立成就列表頁面於 `mobile/src/screens/elder/AchievementScreen.tsx`
- T137 [P] [US2] 建立成就進度元件於 `mobile/src/components/elder/AchievementProgress.tsx`
- T138 [US2] 建立成就解鎖動畫效果

### 4.4 獎項系統移動端（子女）

- T139 [P] [US2] 建立獎項管理頁面於 `mobile/src/screens/child/RewardManageScreen.tsx`
- T140 [P] [US2] 建立獎項編輯器元件於 `mobile/src/components/child/RewardEditor.tsx`
- T141 [P] [US2] 實作獎項圖示選擇器
- T142 [US2] 實作獎項兌換通知接收

**檢查點**：用戶故事 2 完成，獎項系統可獨立測試

---

## Phase 5：用戶故事 3 - 客製化語音激勵功能 (P3)

**目標**：子女錄製語音、長輩運動時播放、語音管理

**獨立測試**：子女錄製語音 → 上傳 → 長輩開始運動 → 聽到語音 → 管理語音

### 5.1 語音系統後端

- T143 [P] [US3] 建立語音服務於 `api/src/services/voice.service.ts`
- T144 [P] [US3] 建立語音控制器於 `api/src/controllers/voice.controller.ts`
- T145 [US3] 建立語音路由於 `api/src/routes/voice.routes.ts`
- T146 [P] [US3] 實作語音上傳端點（POST /voice）
- T147 [P] [US3] 實作語音列表端點（GET /voice）
- T148 [P] [US3] 實作記錄播放端點（POST /voice/:voiceId/play）
- T149 [P] [US3] 實作刪除語音端點（DELETE /voice/:voiceId）
- T150 [P] [US3] 實作隨機語音端點（GET /voice/random）
- T151 [P] [US3] 實作語音配額端點（GET /voice/quota）
- T152 [US3] 實作預設系統語音端點（GET /voice/default）

### 5.2 語音系統移動端（子女）

- T153 [P] [US3] 建立語音 API 於 `mobile/src/store/api/voiceApi.ts`
- T154 [P] [US3] 建立語音狀態切片於 `mobile/src/store/slices/voiceSlice.ts`
- T155 [P] [US3] 建立語音服務（錄製/播放）於 `mobile/src/services/voice.service.ts`
- T156 [P] [US3] 建立語音管理頁面於 `mobile/src/screens/child/VoiceManageScreen.tsx`
- T157 [P] [US3] 建立語音錄製器元件於 `mobile/src/components/child/VoiceRecorder.tsx`
- T158 [P] [US3] 建立語音列表元件於 `mobile/src/components/child/VoiceList.tsx`
- T159 [US3] 實作語音壓縮（AAC 格式）

### 5.3 語音系統移動端（長輩）

- T160 [P] [US3] 建立語音播放排程器於 `mobile/src/services/voiceScheduler.service.ts`
- T161 [P] [US3] 建立語音播放器元件於 `mobile/src/components/elder/VoicePlayer.tsx`
- T162 [US3] 整合語音播放到運動頁面
- T163 [US3] 實作手動播放語音按鈕
- T164 [US3] 實作語音預載入（運動開始前）

**檢查點**：用戶故事 3 完成，語音功能可獨立測試

---

## Phase 6：個人資料與設定

- T165 [P] 建立長輩個人資料頁面於 `mobile/src/screens/elder/ProfileScreen.tsx`
- T166 [P] 建立子女個人資料頁面於 `mobile/src/screens/child/ProfileScreen.tsx`
- T167 [P] 實作頭像上傳功能
- T168 [P] 實作密碼修改功能
- T169 [P] 建立通知設定頁面於 `mobile/src/screens/common/NotificationSettingsScreen.tsx`
- T170 [P] 實作通知偏好設定（開關各類通知）
- T171 實作勿擾時段設定

---

## Phase 7：優化與跨功能需求

目的：影響多個用戶故事的改進

### 7.1 效能優化

- T172 [P] 實作運動記錄列表虛擬化（FlatList 優化）
- T173 [P] 實作圖片懶載入
- T174 [P] 實作語音檔案預載入和快取
- T175 [P] 優化 App 啟動時間（延遲載入非關鍵模組）
- T176 [P] 後端 API 回應快取策略

### 7.2 無障礙支援

- T177 [P] 實作文字轉語音（TTS）操作提示
- T178 [P] 實作所有按鈕震動回饋
- T179 [P] 確保所有元件支援大字體模式
- T180 優化色彩對比度（WCAG AA 標準）

### 7.3 錯誤處理和日誌

- T181 [P] 整合 Sentry 錯誤追蹤（後端）
- T182 [P] 整合 Sentry 錯誤追蹤（移動端）
- T183 [P] 實作結構化日誌（Winston）
- T184 建立錯誤報告 UI 元件

### 7.4 安全性強化

- T185 [P] 實作 API Rate Limiting
- T186 [P] 實作 CORS 配置
- T187 [P] 實作敏感資料加密（電話號碼）
- T188 [P] 實作請求參數消毒（防 XSS/SQL Injection）

### 7.5 測試

- T189 [P] 撰寫認證 API 單元測試於 `api/tests/unit/auth.test.ts`
- T190 [P] 撰寫運動 API 單元測試於 `api/tests/unit/exercise.test.ts`
- T191 [P] 撰寫獎項 API 單元測試於 `api/tests/unit/reward.test.ts`
- T192 [P] 撰寫語音 API 單元測試於 `api/tests/unit/voice.test.ts`
- T193 [P] 撰寫認證流程整合測試於 `api/tests/integration/auth.test.ts`
- T194 [P] 撰寫運動流程整合測試於 `api/tests/integration/exercise.test.ts`
- T195 撰寫元件測試（移動端）於 `mobile/tests/`

### 7.6 文檔和部署

- T196 [P] 建立 API 文檔（Swagger/OpenAPI）
- T197 [P] 更新 README.md 專案說明
- T198 [P] 建立部署指南於 `docs/deployment/`
- T199 執行 quickstart.md 驗證（確保新開發者可順利啟動）
- T200 準備 App Store 和 Google Play 上架資料

**檢查點**：所有功能完成，可以進行最終測試和上架

---

## 依賴與執行順序

### 階段依賴

1. **Phase 1（設定）**：無依賴 - 可立即開始
2. **Phase 2（基礎建設）**：依賴 Phase 1 完成 - **阻塞所有用戶故事**
3. **Phase 3-5（用戶故事）**：依賴 Phase 2 完成
   - 可並行開發（如有多人團隊）
   - 或依優先級順序開發（P1 → P2 → P3）
4. **Phase 6（個人資料）**：依賴 Phase 3 認證系統完成
5. **Phase 7（優化）**：依賴所有用戶故事完成

### 用戶故事內部依賴

**用戶故事 1（P1）**：
- 認證系統 → 綁定系統 → 運動記錄 → 通知 → 緊急求助 → 離線支援

**用戶故事 2（P2）**：
- 可在 P1 完成後立即開始
- 獎項服務 → 成就服務 → 移動端頁面

**用戶故事 3（P3）**：
- 可在 P1 完成後立即開始
- 語音服務 → 子女錄製 → 長輩播放

### 並行機會

**Phase 2 內部可並行**：
- 所有標記 [P] 的任務（T015-T042）

**Phase 3 內部可並行**：
- 後端和移動端可並行開發
- 同一系統內標記 [P] 的任務

**跨用戶故事並行**：
```
團隊 A：Phase 3 (P1 MVP)
團隊 B：等待 Phase 2 完成後，開始 Phase 4 (P2)
團隊 C：等待 Phase 2 完成後，開始 Phase 5 (P3)
```

---

## 實作策略

### MVP 優先（僅用戶故事 1）

1. 完成 Phase 1：設定
2. 完成 Phase 2：基礎建設（**關鍵 - 阻塞所有故事**）
3. 完成 Phase 3：用戶故事 1 (P1)
4. **停下並驗證**：測試 P1 獨立功能
5. 部署/展示（可選）

### 增量交付

1. Phase 1 + 2 → 基礎就緒
2. 新增 Phase 3 (P1) → 獨立測試 → 部署（MVP！）
3. 新增 Phase 4 (P2) → 獨立測試 → 部署
4. 新增 Phase 5 (P3) → 獨立測試 → 部署
5. 每個故事獨立增加價值，不影響之前的故事

### 並行團隊策略

多開發者情況：
1. 團隊一起完成 Phase 1 + 2
2. Phase 2 完成後：
   - 開發者 A：用戶故事 1 (P1)
   - 開發者 B：用戶故事 2 (P2)
   - 開發者 C：用戶故事 3 (P3)
3. 各故事獨立完成並整合

---

## 任務統計

- **總任務數**：200 個
- **Phase 1（設定）**：9 個任務
- **Phase 2（基礎建設）**：33 個任務
- **Phase 3（P1 MVP）**：73 個任務
- **Phase 4（P2 獎項）**：27 個任務
- **Phase 5（P3 語音）**：22 個任務
- **Phase 6（個人資料）**：7 個任務
- **Phase 7（優化）**：29 個任務

---

## 預估時程

依據 plan.md 的時程預估：

| 階段 | 時程 | 說明 |
|------|------|------|
| Phase 1-2 | 1-2 週 | 設定和基礎建設 |
| Phase 3 (P1) | 4-6 週 | 核心 MVP |
| Phase 4 (P2) | 2-3 週 | 獎項系統 |
| Phase 5 (P3) | 2-3 週 | 語音功能 |
| Phase 6-7 | 2-3 週 | 優化和測試 |
| **總計** | **11-17 週** | 約 3-4 個月 |

---

## 備註

- **[P]** 任務代表不同檔案、無依賴，可並行執行
- **[USn]** 標籤將任務對應到特定用戶故事，便於追蹤
- 每個用戶故事應該可以獨立完成並測試
- 實作前先驗證測試失敗
- 每個任務或邏輯群組完成後提交
- 在任何檢查點停下來驗證故事獨立性
- 避免：模糊任務、同一檔案衝突、破壞獨立性的跨故事依賴
