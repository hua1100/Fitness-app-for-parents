import * as admin from 'firebase-admin';

// Firebase Admin SDK 初始化
let firebaseApp: admin.app.App | null = null;

export const initializeFirebase = (): admin.app.App => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    console.warn('Firebase 服務帳戶未配置，推播通知功能將無法使用');
    // 返回一個虛擬的 app 用於開發環境
    firebaseApp = admin.initializeApp({
      projectId: 'dummy-project',
    });
    return firebaseApp;
  }

  try {
    const credentials = JSON.parse(serviceAccount);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(credentials),
      projectId: credentials.project_id,
    });

    console.log('Firebase Admin SDK 初始化成功');
  } catch (error) {
    console.error('Firebase 初始化失敗:', error);
    // 創建一個基本的 app 以避免錯誤
    firebaseApp = admin.initializeApp({
      projectId: 'fallback-project',
    });
  }

  return firebaseApp;
};

// 取得 Firebase Messaging 實例
export const getMessaging = (): admin.messaging.Messaging => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.messaging();
};

// 取得 Firebase App
export const getFirebaseApp = (): admin.app.App => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return firebaseApp!;
};

// 初始化（在應用啟動時呼叫）
initializeFirebase();
