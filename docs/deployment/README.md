# 部署指南

本文檔說明如何部署長輩健身 App 的後端服務。

## 目錄

1. [系統需求](#系統需求)
2. [環境變數設定](#環境變數設定)
3. [本機開發環境](#本機開發環境)
4. [Docker 部署](#docker-部署)
5. [生產環境部署](#生產環境部署)
6. [資料庫遷移](#資料庫遷移)
7. [監控與日誌](#監控與日誌)
8. [故障排除](#故障排除)

---

## 系統需求

### 後端服務

- Node.js 20 LTS 或更高版本
- PostgreSQL 16 或更高版本
- Redis 7 或更高版本（用於 Session 和快取）

### 行動應用

- React Native 0.73+
- iOS 13+ / Android 8+

---

## 環境變數設定

在部署前，請先設定以下環境變數：

### 必要環境變數

```bash
# 伺服器設定
NODE_ENV=production
PORT=3000

# 資料庫
DATABASE_URL=postgresql://user:password@host:5432/fitness_app

# JWT 認證
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Firebase Cloud Messaging
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="your-private-key"

# 檔案儲存
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760

# CORS
CORS_ORIGIN=https://your-app-domain.com
```

### 選用環境變數

```bash
# Sentry 錯誤追蹤
SENTRY_DSN=https://xxx@sentry.io/xxx

# Redis（用於 Rate Limiting）
REDIS_URL=redis://localhost:6379

# 日誌
LOG_LEVEL=info
LOG_DIR=/app/logs
```

---

## 本機開發環境

### 1. 安裝依賴

```bash
# 安裝後端依賴
cd api
npm install

# 安裝行動端依賴
cd ../mobile
npm install
```

### 2. 設定環境變數

```bash
# 複製範例環境變數檔
cd api
cp .env.example .env

# 編輯 .env 檔案，填入適當的值
```

### 3. 啟動資料庫

```bash
# 使用 Docker 啟動 PostgreSQL
docker run -d \
  --name fitness-postgres \
  -e POSTGRES_USER=fitness \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=fitness_app \
  -p 5432:5432 \
  postgres:16
```

### 4. 執行資料庫遷移

```bash
cd api
npx prisma migrate dev
npx prisma db seed
```

### 5. 啟動開發伺服器

```bash
# 後端
cd api
npm run dev

# 行動端
cd mobile
npm start
```

---

## Docker 部署

### 使用 Docker Compose

1. **建立 docker-compose.yml**

```yaml
version: '3.8'

services:
  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://fitness:password@postgres:5432/fitness_app
      - JWT_SECRET=${JWT_SECRET}
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
      - FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
    depends_on:
      - postgres
      - redis
    volumes:
      - uploads:/app/uploads
      - logs:/app/logs

  postgres:
    image: postgres:16
    environment:
      - POSTGRES_USER=fitness
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=fitness_app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
  uploads:
  logs:
```

2. **建立並啟動容器**

```bash
# 建立映像
docker-compose build

# 啟動服務
docker-compose up -d

# 執行資料庫遷移
docker-compose exec api npx prisma migrate deploy

# 查看日誌
docker-compose logs -f api
```

### API Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 安裝依賴
COPY package*.json ./
RUN npm ci --only=production

# 複製原始碼
COPY . .

# 產生 Prisma Client
RUN npx prisma generate

# 建置專案
RUN npm run build

# 建立上傳目錄
RUN mkdir -p /app/uploads /app/logs

EXPOSE 3000

CMD ["npm", "start"]
```

---

## 生產環境部署

### 雲端平台建議

1. **AWS**
   - EC2 或 ECS 用於執行 API
   - RDS PostgreSQL 用於資料庫
   - ElastiCache 用於 Redis
   - S3 用於檔案儲存
   - CloudWatch 用於監控

2. **Google Cloud**
   - Cloud Run 或 GKE 用於 API
   - Cloud SQL 用於資料庫
   - Memorystore 用於 Redis
   - Cloud Storage 用於檔案儲存

3. **Azure**
   - App Service 或 AKS 用於 API
   - Azure Database for PostgreSQL
   - Azure Cache for Redis
   - Blob Storage 用於檔案儲存

### 部署檢查清單

- [ ] 設定 SSL/TLS 憑證
- [ ] 設定反向代理（Nginx/Apache）
- [ ] 設定防火牆規則
- [ ] 啟用資料庫自動備份
- [ ] 設定日誌輪替
- [ ] 設定健康檢查端點
- [ ] 設定自動擴展（如適用）
- [ ] 設定 CDN 用於靜態資源

### Nginx 反向代理設定

```nginx
server {
    listen 80;
    server_name api.fitness-app.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.fitness-app.com;

    ssl_certificate /etc/ssl/certs/fitness-app.crt;
    ssl_certificate_key /etc/ssl/private/fitness-app.key;

    # SSL 安全設定
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # 安全標頭
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket 支援
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # 靜態檔案
    location /uploads {
        alias /app/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 資料庫遷移

### 開發環境

```bash
# 建立新的遷移
npx prisma migrate dev --name your_migration_name

# 重置資料庫（會清除所有資料）
npx prisma migrate reset
```

### 生產環境

```bash
# 部署遷移
npx prisma migrate deploy

# 驗證遷移狀態
npx prisma migrate status
```

### 備份與還原

```bash
# 備份資料庫
pg_dump -U fitness -d fitness_app > backup_$(date +%Y%m%d).sql

# 還原資料庫
psql -U fitness -d fitness_app < backup_20240101.sql
```

---

## 監控與日誌

### 健康檢查端點

API 提供以下健康檢查端點：

- `GET /health` - 基本健康檢查
- `GET /health/ready` - 就緒檢查（包含資料庫連線）

### 日誌

應用程式日誌位於 `logs/` 目錄：

- `combined.log` - 所有日誌
- `error.log` - 錯誤日誌
- `api.log` - API 請求日誌
- `auth.log` - 認證日誌

### Sentry 錯誤追蹤

若要啟用 Sentry 錯誤追蹤：

1. 在 Sentry 建立專案
2. 設定 `SENTRY_DSN` 環境變數
3. 錯誤會自動上報至 Sentry

### 效能監控

建議使用以下工具進行效能監控：

- **APM**: New Relic, Datadog, 或 Elastic APM
- **指標**: Prometheus + Grafana
- **日誌**: ELK Stack 或 CloudWatch Logs

---

## 故障排除

### 常見問題

#### 1. 資料庫連線失敗

```
Error: P1001: Can't reach database server
```

**解決方案**:
- 確認 PostgreSQL 服務正在執行
- 檢查 `DATABASE_URL` 是否正確
- 確認防火牆允許連線

#### 2. JWT Token 無效

```
Error: JsonWebTokenError: invalid signature
```

**解決方案**:
- 確認 `JWT_SECRET` 在所有服務中一致
- 清除用戶端快取的 Token

#### 3. FCM 推播失敗

```
Error: Firebase: Invalid credential
```

**解決方案**:
- 檢查 Firebase 憑證是否正確
- 確認 `FIREBASE_PRIVATE_KEY` 包含完整的私鑰

#### 4. 檔案上傳失敗

```
Error: ENOENT: no such file or directory
```

**解決方案**:
- 確認 `UPLOAD_DIR` 目錄存在
- 檢查目錄權限

### 日誌分析

```bash
# 查看最近的錯誤
tail -100 logs/error.log

# 搜尋特定錯誤
grep "ECONNREFUSED" logs/combined.log

# 統計 API 回應碼
cat logs/api.log | grep -o '"statusCode":[0-9]*' | sort | uniq -c
```

### 效能調校

1. **資料庫索引**: 確保常用查詢欄位有適當的索引
2. **連線池**: 調整 Prisma 連線池大小
3. **快取**: 使用 Redis 快取常用資料
4. **壓縮**: 啟用 gzip 壓縮 API 回應

---

## 安全建議

1. **定期更新依賴套件**
   ```bash
   npm audit
   npm update
   ```

2. **使用強密碼**
   - 資料庫密碼至少 16 個字元
   - JWT Secret 至少 32 個字元

3. **限制資料庫存取**
   - 只允許 API 伺服器 IP 連線
   - 使用 SSL 連線

4. **啟用 Rate Limiting**
   - 已內建於 API

5. **定期備份**
   - 每日自動備份資料庫
   - 備份保留至少 30 天

---

如有任何問題，請聯繫開發團隊或提交 Issue。
