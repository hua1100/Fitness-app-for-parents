import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { config } from 'dotenv';

import { prisma } from './config/database';
import { initializeWebSocket } from './websocket';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

// 載入環境變數
config();

const app = express();
const httpServer = createServer(app);

// 初始化 WebSocket
initializeWebSocket(httpServer);

// 基本中介軟體
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API 路由
app.get('/api', (req, res) => {
  res.json({
    message: '長輩運動關懷應用程式 API',
    version: '1.0.0',
  });
});

// TODO: 在 Phase 3 添加路由
// app.use('/api/auth', authRoutes);
// app.use('/api/binding', bindingRoutes);
// app.use('/api/exercise', exerciseRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/rewards', rewardRoutes);
// app.use('/api/voice', voiceRoutes);

// 404 處理
app.use(notFoundHandler);

// 錯誤處理
app.use(errorHandler);

// 啟動伺服器
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 測試資料庫連線
    await prisma.$connect();
    console.log('資料庫連線成功');

    httpServer.listen(PORT, () => {
      console.log(`伺服器運行於 http://localhost:${PORT}`);
      console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('伺服器啟動失敗:', error);
    process.exit(1);
  }
};

// 優雅關閉
const gracefulShutdown = async () => {
  console.log('正在關閉伺服器...');

  httpServer.close(async () => {
    await prisma.$disconnect();
    console.log('伺服器已關閉');
    process.exit(0);
  });

  // 強制關閉超時
  setTimeout(() => {
    console.error('強制關閉伺服器');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();

export { app, httpServer };
