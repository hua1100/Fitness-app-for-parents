# API 合約：認證與授權

專案：001-elderly-fitness-app | 版本：v1 | 日期：2025-11-18

## 基本資訊

**Base URL**：`https://api.fitness-app.com/v1`

**認證方式**：JWT Bearer Token

```http
Authorization: Bearer <access_token>
```

**通用回應格式**：

成功回應：
```json
{
  "success": true,
  "data": { ... }
}
```

錯誤回應：
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤訊息",
    "details": { ... }  // 選填
  }
}
```

---

## 端點列表

### 1. 註冊

建立新用戶帳號（長輩或子女）。

**端點**：`POST /auth/register`

**請求標頭**：
```
Content-Type: application/json
```

**請求主體**：
```typescript
interface RegisterRequest {
  email: string;           // 電子郵件
  password: string;        // 密碼（最少 8 字元）
  name: string;            // 姓名
  role: 'ELDER' | 'CHILD'; // 角色
  phone?: string;          // 電話（選填）
  birthDate?: string;      // 出生日期 ISO 8601（選填，長輩可填）
}
```

**範例請求**：
```json
{
  "email": "wang123@example.com",
  "password": "SecurePass123!",
  "name": "王小明",
  "role": "ELDER",
  "phone": "+886912345678",
  "birthDate": "1950-03-15"
}
```

**回應**：`201 Created`
```typescript
interface RegisterResponse {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'ELDER' | 'CHILD';
      avatar: string | null;
      phone: string | null;
      birthDate: string | null;
      createdAt: string;      // ISO 8601
    };
    tokens: {
      accessToken: string;   // JWT (15 分鐘有效)
      refreshToken: string;  // Refresh Token (7 天有效)
    };
  };
}
```

**錯誤回應**：

`400 Bad Request` - 驗證失敗
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "輸入資料驗證失敗",
    "details": {
      "email": ["電子郵件格式不正確"],
      "password": ["密碼至少需要 8 個字元"]
    }
  }
}
```

`409 Conflict` - 電子郵件已存在
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "此電子郵件已被註冊"
  }
}
```

---

### 2. 登入

使用電子郵件和密碼登入。

**端點**：`POST /auth/login`

**請求主體**：
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**範例請求**：
```json
{
  "email": "wang123@example.com",
  "password": "SecurePass123!"
}
```

**回應**：`200 OK`
```typescript
interface LoginResponse {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'ELDER' | 'CHILD';
      avatar: string | null;
      // 長輩專屬欄位
      totalPoints?: number;
      currentPoints?: number;
      consecutiveDays?: number;
      lastActiveAt?: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}
```

**錯誤回應**：

`401 Unauthorized` - 憑證錯誤
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "電子郵件或密碼錯誤"
  }
}
```

---

### 3. 刷新 Token

使用 Refresh Token 取得新的 Access Token。

**端點**：`POST /auth/refresh`

**請求主體**：
```typescript
interface RefreshRequest {
  refreshToken: string;
}
```

**回應**：`200 OK`
```typescript
interface RefreshResponse {
  success: true;
  data: {
    accessToken: string;
    refreshToken: string;  // 新的 Refresh Token
  };
}
```

**錯誤回應**：

`401 Unauthorized` - Token 無效或過期
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh Token 無效或已過期"
  }
}
```

---

### 4. 登出

登出並撤銷 Refresh Token。

**端點**：`POST /auth/logout`

**請求標頭**：
```
Authorization: Bearer <access_token>
```

**請求主體**：
```typescript
interface LogoutRequest {
  refreshToken: string;
}
```

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "message": "登出成功"
  }
}
```

---

### 5. 取得當前用戶資訊

取得已登入用戶的完整資料。

**端點**：`GET /auth/me`

**請求標頭**：
```
Authorization: Bearer <access_token>
```

**回應**：`200 OK`
```typescript
interface MeResponse {
  success: true;
  data: {
    id: string;
    email: string;
    name: string;
    role: 'ELDER' | 'CHILD';
    avatar: string | null;
    phone: string | null;
    birthDate: string | null;
    // 長輩專屬
    totalPoints?: number;
    currentPoints?: number;
    consecutiveDays?: number;
    lastActiveAt?: string;
    // 統計資訊
    stats?: {
      totalExercises: number;
      totalDurationMinutes: number;
      achievementsCount: number;
      bindingsCount: number;
    };
    createdAt: string;
    updatedAt: string;
  };
}
```

---

### 6. 更新用戶資料

更新當前用戶的個人資料。

**端點**：`PATCH /auth/me`

**請求標頭**：
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**請求主體**：
```typescript
interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  birthDate?: string;     // ISO 8601
  avatar?: string;        // S3 URL（另有上傳頭像 API）
}
```

**範例請求**：
```json
{
  "name": "王大明",
  "phone": "+886987654321"
}
```

**回應**：`200 OK`
```typescript
interface UpdateProfileResponse {
  success: true;
  data: {
    // 更新後的用戶資料（同 GET /auth/me）
  };
}
```

---

### 7. 修改密碼

修改當前用戶的密碼。

**端點**：`POST /auth/change-password`

**請求標頭**：
```
Authorization: Bearer <access_token>
```

**請求主體**：
```typescript
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
```

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "message": "密碼修改成功"
  }
}
```

**錯誤回應**：

`401 Unauthorized` - 當前密碼錯誤
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "當前密碼錯誤"
  }
}
```

---

### 8. 忘記密碼（發送重設連結）

發送密碼重設連結到用戶信箱。

**端點**：`POST /auth/forgot-password`

**請求主體**：
```typescript
interface ForgotPasswordRequest {
  email: string;
}
```

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "message": "密碼重設連結已發送到您的信箱"
  }
}
```

**備註**：無論電子郵件是否存在，都回應成功（防止帳號探測）

---

### 9. 重設密碼

使用重設 Token 重設密碼。

**端點**：`POST /auth/reset-password`

**請求主體**：
```typescript
interface ResetPasswordRequest {
  token: string;          // 從信箱連結取得的 Token
  newPassword: string;
}
```

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "message": "密碼重設成功"
  }
}
```

**錯誤回應**：

`400 Bad Request` - Token 無效或過期
```json
{
  "success": false,
  "error": {
    "code": "INVALID_RESET_TOKEN",
    "message": "重設連結無效或已過期"
  }
}
```

---

### 10. 上傳頭像

上傳用戶頭像圖片。

**端點**：`POST /auth/avatar`

**請求標頭**：
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**請求主體**（FormData）：
```
avatar: File  // 圖片檔案（支援 JPG, PNG，最大 5MB）
```

**回應**：`200 OK`
```typescript
interface UploadAvatarResponse {
  success: true;
  data: {
    avatarUrl: string;  // S3 URL
  };
}
```

**錯誤回應**：

`400 Bad Request` - 檔案格式或大小錯誤
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE",
    "message": "僅支援 JPG 和 PNG 格式，檔案大小不可超過 5MB"
  }
}
```

---

### 11. 註冊 FCM Token

註冊或更新裝置的 FCM 推播 Token。

**端點**：`POST /auth/device-token`

**請求標頭**：
```
Authorization: Bearer <access_token>
```

**請求主體**：
```typescript
interface RegisterDeviceTokenRequest {
  token: string;           // FCM Token
  platform: 'IOS' | 'ANDROID' | 'WEB';
  deviceId?: string;       // 裝置唯一 ID
  deviceName?: string;     // 裝置名稱（如「iPhone 13」）
}
```

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "message": "裝置 Token 註冊成功"
  }
}
```

---

### 12. 刪除 FCM Token

移除裝置的 FCM Token（登出裝置或停用推播時使用）。

**端點**：`DELETE /auth/device-token/:token`

**請求標頭**：
```
Authorization: Bearer <access_token>
```

**回應**：`200 OK`
```json
{
  "success": true,
  "data": {
    "message": "裝置 Token 已移除"
  }
}
```

---

## 錯誤代碼總覽

| 錯誤代碼 | HTTP 狀態碼 | 說明 |
|---------|-----------|------|
| `VALIDATION_ERROR` | 400 | 輸入資料驗證失敗 |
| `EMAIL_EXISTS` | 409 | 電子郵件已被註冊 |
| `INVALID_CREDENTIALS` | 401 | 登入憑證錯誤 |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh Token 無效或過期 |
| `INVALID_PASSWORD` | 401 | 當前密碼錯誤 |
| `INVALID_RESET_TOKEN` | 400 | 密碼重設 Token 無效或過期 |
| `INVALID_FILE` | 400 | 上傳檔案格式或大小錯誤 |
| `UNAUTHORIZED` | 401 | 未提供有效的 Access Token |
| `FORBIDDEN` | 403 | 無權執行此操作 |
| `INTERNAL_ERROR` | 500 | 伺服器內部錯誤 |

---

## JWT Payload 結構

Access Token 的 JWT Payload 包含：

```typescript
interface JWTPayload {
  sub: string;        // User ID
  email: string;
  role: 'ELDER' | 'CHILD';
  iat: number;        // Issued At (Unix timestamp)
  exp: number;        // Expiration (Unix timestamp)
}
```

**有效期限**：
- Access Token：15 分鐘
- Refresh Token：7 天

---

## 安全性考量

1. **密碼強度**：最少 8 字元，建議包含大小寫字母、數字和特殊符號
2. **Rate Limiting**：登入端點限制每 IP 每分鐘 5 次請求
3. **HTTPS Only**：所有 API 僅支援 HTTPS
4. **Token 儲存**：
   - Access Token：儲存於記憶體（不存 localStorage）
   - Refresh Token：儲存於 HttpOnly Cookie 或安全儲存體
5. **密碼雜湊**：使用 Bcrypt (cost factor = 10)
6. **重設連結**：密碼重設 Token 有效期限 1 小時

---

## 範例程式碼（客戶端）

```typescript
// 註冊
async function register(data: RegisterRequest) {
  const response = await fetch('https://api.fitness-app.com/v1/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (result.success) {
    // 儲存 Token
    await storeTokens(result.data.tokens);
    return result.data.user;
  } else {
    throw new Error(result.error.message);
  }
}

// 登入
async function login(email: string, password: string) {
  const response = await fetch('https://api.fitness-app.com/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if (result.success) {
    await storeTokens(result.data.tokens);
    return result.data.user;
  } else {
    throw new Error(result.error.message);
  }
}

// 使用 Access Token 呼叫 API
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const accessToken = await getAccessToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  // 如果 Token 過期，自動刷新
  if (response.status === 401) {
    await refreshAccessToken();
    return fetchWithAuth(url, options);  // 重試
  }

  return response;
}

// 刷新 Token
async function refreshAccessToken() {
  const refreshToken = await getRefreshToken();

  const response = await fetch('https://api.fitness-app.com/v1/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  const result = await response.json();

  if (result.success) {
    await storeTokens(result.data);
  } else {
    // Refresh Token 也過期，導向登入頁
    await logout();
    navigateToLogin();
  }
}
```

---

## 測試案例

### 1. 註冊流程測試

```typescript
describe('POST /auth/register', () => {
  it('應該成功註冊新用戶（長輩）', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'test-elder@example.com',
        password: 'SecurePass123!',
        name: '測試長輩',
        role: 'ELDER',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.role).toBe('ELDER');
    expect(response.body.data.tokens.accessToken).toBeDefined();
  });

  it('應該拒絕重複的電子郵件', async () => {
    // 先註冊一次
    await request(app).post('/auth/register').send({
      email: 'duplicate@example.com',
      password: 'Pass123!',
      name: '測試',
      role: 'ELDER',
    });

    // 再次註冊相同email
    const response = await request(app).post('/auth/register').send({
      email: 'duplicate@example.com',
      password: 'Pass456!',
      name: '測試2',
      role: 'CHILD',
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_EXISTS');
  });
});
```

### 2. 登入流程測試

```typescript
describe('POST /auth/login', () => {
  beforeEach(async () => {
    // 建立測試用戶
    await createTestUser({
      email: 'login-test@example.com',
      password: 'TestPass123!',
      role: 'ELDER',
    });
  });

  it('應該成功登入', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'login-test@example.com',
        password: 'TestPass123!',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tokens).toBeDefined();
  });

  it('應該拒絕錯誤的密碼', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'login-test@example.com',
        password: 'WrongPassword',
      });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
```

---

## 變更記錄

- **v1 (2025-11-18)**：初始版本
