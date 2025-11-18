# 快速啟動指南：長輩運動關懷應用程式

專案：001-elderly-fitness-app | 日期：2025-11-18

## 概述

本指南幫助開發者快速設定開發環境並啟動長輩運動 app 的前後端專案。

**專案結構**：
- `api/` - Node.js 後端 API 服務
- `mobile/` - React Native 移動應用

---

## 系統需求

### 通用需求

| 工具 | 版本 | 用途 |
|------|------|------|
| Node.js | 20 LTS | 後端執行環境和前端建置工具 |
| pnpm | 8.x+ | 套件管理器（推薦，也可用 npm/yarn） |
| Git | 2.x+ | 版本控制 |
| PostgreSQL | 16+ | 主要資料庫 |
| Docker | 20.x+ | 容器化（選用，用於快速啟動資料庫） |

### 後端開發需求

- PostgreSQL 客戶端（psql 或 pgAdmin）
- Postman 或 Thunder Client（API 測試）

### 移動端開發需求

#### iOS 開發（僅 macOS）

| 工具 | 版本 | 用途 |
|------|------|------|
| Xcode | 15.0+ | iOS 開發環境 |
| CocoaPods | 1.12+ | iOS 套件管理 |
| iOS Simulator | - | 測試用模擬器 |

#### Android 開發

| 工具 | 版本 | 用途 |
|------|------|------|
| Android Studio | 2023.x+ | Android 開發環境 |
| JDK | 17 | Java 開發工具包 |
| Android SDK | API Level 26+ | Android 開發套件 |
| Android Emulator | - | 測試用模擬器 |

---

## 專案設定

### 第一步：克隆倉庫

```bash
# 克隆專案倉庫
git clone https://github.com/your-org/Fitness-app-for-parents.git
cd Fitness-app-for-parents

# 切換到開發分支
git checkout develop
```

---

### 第二步：後端設定

#### 2.1 安裝依賴

```bash
cd api

# 安裝套件（使用 pnpm，也可用 npm install）
pnpm install
```

#### 2.2 設定資料庫

**選項 A：使用 Docker（推薦）**

```bash
# 啟動 PostgreSQL 容器
docker run -d \
  --name fitness-app-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=fitness_app_dev \
  -p 5432:5432 \
  postgres:16-alpine

# 驗證資料庫是否正常運作
docker ps | grep fitness-app-postgres
```

**選項 B：本地安裝 PostgreSQL**

```bash
# macOS（使用 Homebrew）
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt-get install postgresql-16
sudo systemctl start postgresql

# Windows
# 下載並安裝：https://www.postgresql.org/download/windows/

# 建立資料庫
createdb fitness_app_dev
```

#### 2.3 設定環境變數

```bash
# 複製環境變數範本
cp .env.example .env

# 編輯 .env 檔案
nano .env
```

`.env` 檔案內容：

```bash
# 資料庫連線
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fitness_app_dev"

# JWT 密鑰（請更換為隨機字串）
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-refresh-token-secret-key"

# 加密密鑰（32 bytes hex）
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# 伺服器設定
PORT=3000
NODE_ENV=development

# Firebase（推播通知）
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_CLIENT_EMAIL="your-firebase-client-email"

# AWS S3（語音檔案儲存）
AWS_REGION="ap-northeast-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="fitness-app-voices-dev"

# CORS 設定
CORS_ORIGIN="http://localhost:3000,http://localhost:19000"

# Redis（選用，用於快取）
REDIS_URL="redis://localhost:6379"
```

#### 2.4 執行資料庫遷移

```bash
# 生成 Prisma Client
npx prisma generate

# 執行資料庫遷移
npx prisma migrate dev

# 填入種子資料（系統預設獎項、成就）
npx prisma db seed
```

#### 2.5 啟動後端服務

```bash
# 開發模式（支援 hot reload）
pnpm dev

# 或使用 npm
npm run dev
```

**驗證後端是否正常運作**：

```bash
# 測試健康檢查端點
curl http://localhost:3000/health

# 預期回應：
# {"status":"ok","timestamp":"2025-11-18T10:00:00.000Z"}
```

---

### 第三步：移動端設定

#### 3.1 安裝依賴

```bash
cd ../mobile

# 安裝 JavaScript 套件
pnpm install

# iOS：安裝 CocoaPods 依賴
cd ios
pod install
cd ..
```

#### 3.2 設定環境變數

```bash
# 複製環境變數範本
cp .env.example .env

# 編輯 .env 檔案
nano .env
```

`.env` 檔案內容：

```bash
# API 端點
API_URL=http://localhost:3000/v1

# WebSocket 端點
WEBSOCKET_URL=http://localhost:3000

# Firebase 配置（推播通知）
FIREBASE_API_KEY="your-firebase-api-key"
FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
FIREBASE_APP_ID="your-app-id"

# 環境
ENV=development

# 日誌等級
LOG_LEVEL=debug
```

#### 3.3 iOS 設定（僅 macOS）

```bash
# 開啟 Xcode 專案
open ios/FitnessApp.xcworkspace

# 在 Xcode 中：
# 1. 選擇開發團隊（Signing & Capabilities）
# 2. 修改 Bundle Identifier（如果需要）
# 3. 設定推播通知權限
```

**設定 Firebase（iOS）**：
1. 從 Firebase Console 下載 `GoogleService-Info.plist`
2. 將檔案拖曳到 Xcode 專案的 `ios/FitnessApp/` 目錄
3. 確保檔案已加入 target

#### 3.4 Android 設定

```bash
# 開啟 Android Studio
# File -> Open -> 選擇 mobile/android 目錄
```

**設定 Firebase（Android）**：
1. 從 Firebase Console 下載 `google-services.json`
2. 將檔案複製到 `mobile/android/app/` 目錄

**設定簽章金鑰（開發用）**：

```bash
cd android/app

# 生成開發金鑰
keytool -genkeypair -v -storetype PKCS12 \
  -keystore debug.keystore \
  -alias androiddebugkey \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass android -keypass android \
  -dname "CN=Android Debug,O=Android,C=US"
```

#### 3.5 啟動移動應用

**方式 A：使用 Metro Bundler（推薦）**

```bash
# 終端 1：啟動 Metro Bundler
pnpm start

# 終端 2：啟動 iOS app
pnpm ios

# 或啟動 Android app
pnpm android
```

**方式 B：直接執行**

```bash
# iOS
pnpm run ios
# 或指定裝置
pnpm run ios --simulator="iPhone 15 Pro"

# Android
pnpm run android
# 或指定裝置
pnpm run android --deviceId=emulator-5554
```

**驗證移動端是否正常運作**：
- 應該能看到登入/註冊畫面
- 檢查 Metro Bundler 終端是否有錯誤

---

## 開發工作流程

### 資料庫管理

```bash
cd api

# 查看資料庫狀態
npx prisma studio   # 開啟視覺化管理介面（http://localhost:5555）

# 建立新的遷移
npx prisma migrate dev --name add_new_field

# 重置資料庫（⚠️ 會刪除所有資料）
npx prisma migrate reset

# 檢視資料庫 schema
npx prisma db pull  # 從資料庫拉取 schema
npx prisma db push  # 推送 schema 到資料庫（不建立遷移）
```

### 執行測試

#### 後端測試

```bash
cd api

# 執行所有測試
pnpm test

# 執行特定測試檔案
pnpm test tests/auth.test.ts

# 執行測試並顯示覆蓋率
pnpm test:coverage

# 監看模式（測試檔案變更時自動重跑）
pnpm test:watch
```

#### 移動端測試

```bash
cd mobile

# 執行 Jest 測試
pnpm test

# 執行 E2E 測試（需要先啟動 app）
pnpm test:e2e:ios      # iOS
pnpm test:e2e:android  # Android
```

### 程式碼品質檢查

```bash
# 後端
cd api
pnpm lint           # ESLint 檢查
pnpm lint:fix       # 自動修復
pnpm format         # Prettier 格式化
pnpm type-check     # TypeScript 型別檢查

# 移動端
cd mobile
pnpm lint
pnpm lint:fix
pnpm format
pnpm type-check
```

---

## 常見問題排解

### 問題 1：資料庫連線失敗

**錯誤訊息**：
```
Error: Can't reach database server at `localhost:5432`
```

**解決方法**：
```bash
# 檢查 PostgreSQL 是否運行
docker ps | grep postgres        # Docker
pg_isready                       # 本地安裝

# 檢查連線字串
psql "postgresql://postgres:postgres@localhost:5432/fitness_app_dev"

# 重啟 PostgreSQL
docker restart fitness-app-postgres   # Docker
brew services restart postgresql@16   # macOS
sudo systemctl restart postgresql     # Linux
```

---

### 問題 2：Metro Bundler 快取問題

**錯誤訊息**：
```
Error: Unable to resolve module ...
```

**解決方法**：
```bash
cd mobile

# 清除快取
pnpm start --reset-cache

# 或手動刪除快取
rm -rf node_modules
rm -rf ios/Pods ios/build
rm -rf android/.gradle android/build
pnpm install
cd ios && pod install && cd ..
```

---

### 問題 3：iOS Simulator 無法啟動

**解決方法**：
```bash
# 列出可用的模擬器
xcrun simctl list devices

# 刪除並重建
xcrun simctl delete unavailable
xcrun simctl erase all

# 重新安裝 pods
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

---

### 問題 4：Android 建置失敗

**錯誤訊息**：
```
Execution failed for task ':app:validateSigningDebug'
```

**解決方法**：
```bash
cd android

# 清除建置快取
./gradlew clean

# 重新建置
./gradlew assembleDebug

# 如果還是失敗，檢查 JDK 版本
java -version  # 應該是 Java 17

# 設定 JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 17)  # macOS
```

---

### 問題 5：推播通知無法運作

**檢查清單**：

1. **Firebase 配置檢查**：
   ```bash
   # iOS：檢查 GoogleService-Info.plist 是否存在
   ls -la ios/FitnessApp/GoogleService-Info.plist

   # Android：檢查 google-services.json 是否存在
   ls -la android/app/google-services.json
   ```

2. **FCM Token 檢查**：
   ```bash
   # 在 app 中列印 FCM Token
   console.log('FCM Token:', await messaging().getToken());
   ```

3. **權限檢查**：
   - iOS：在 Xcode 中確認已啟用 Push Notifications capability
   - Android：在 AndroidManifest.xml 中確認權限設定

4. **測試推播**：
   ```bash
   # 使用 API 測試端點
   curl -X POST http://localhost:3000/v1/notifications/test \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"測試","body":"測試推播通知"}'
   ```

---

### 問題 6：S3 上傳失敗

**錯誤訊息**：
```
Access Denied
```

**解決方法**：

1. **檢查 AWS 憑證**：
   ```bash
   # 驗證 AWS 憑證
   aws sts get-caller-identity
   ```

2. **檢查 S3 Bucket 權限**：
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::ACCOUNT_ID:user/YOUR_USER"
         },
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::fitness-app-voices-dev/*"
       }
     ]
   }
   ```

3. **使用本地檔案儲存（開發用）**：
   ```typescript
   // api/src/config/aws.ts
   const useLocalStorage = process.env.NODE_ENV === 'development';

   if (useLocalStorage) {
     // 儲存到本地 uploads/ 目錄
   }
   ```

---

## 開發工具推薦

### 程式碼編輯器

**VS Code 推薦擴充套件**：
- ESLint
- Prettier
- Prisma
- React Native Tools
- GitLens
- Thunder Client（API 測試）
- Error Lens

**VS Code 設定**（`.vscode/settings.json`）：
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### API 測試工具

**Postman Collection**：

匯入 `api/postman/fitness-app.postman_collection.json`

**cURL 快速測試**：
```bash
# 註冊
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "測試用戶",
    "role": "ELDER"
  }'

# 登入
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# 開始運動（需要 Token）
curl -X POST http://localhost:3000/v1/exercise/start \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "WALKING"
  }'
```

### 資料庫工具

- **Prisma Studio**：`npx prisma studio`（內建，推薦）
- **pgAdmin**：視覺化管理工具
- **DBeaver**：跨平台資料庫工具
- **TablePlus**：macOS/Windows 資料庫工具

---

## 部署準備

### 後端部署檢查清單

- [ ] 環境變數已設定（生產環境）
- [ ] 資料庫遷移已執行
- [ ] JWT 密鑰已更換（強度足夠）
- [ ] CORS 設定已更新（僅允許生產網域）
- [ ] 錯誤追蹤已設定（如 Sentry）
- [ ] 日誌已配置（如 Winston）
- [ ] Rate Limiting 已啟用
- [ ] HTTPS 已啟用
- [ ] 資料庫備份已設定

### 移動端部署檢查清單

- [ ] API_URL 已更新為生產環境
- [ ] Firebase 配置已更換（生產專案）
- [ ] App 圖示和啟動畫面已設定
- [ ] 版本號已更新
- [ ] 推播通知已測試
- [ ] iOS：上架 App Store Connect
- [ ] Android：上架 Google Play Console

---

## 後續步驟

完成快速啟動後，建議閱讀：

1. **[spec.md](./spec.md)** - 完整功能規格
2. **[plan.md](./plan.md)** - 技術實施計劃
3. **[data-model.md](./data-model.md)** - 資料庫架構
4. **[contracts/](./contracts/)** - API 合約文件
5. **[research.md](./research.md)** - 技術研究報告

---

## 取得協助

**專案文檔**：
- GitHub Wiki：https://github.com/your-org/Fitness-app-for-parents/wiki
- API 文檔：http://localhost:3000/api-docs（啟動後端後可訪問）

**聯絡方式**：
- 技術問題：開 GitHub Issue
- 團隊討論：Slack #fitness-app-dev

---

## 變更記錄

- **v1 (2025-11-18)**：初始版本
