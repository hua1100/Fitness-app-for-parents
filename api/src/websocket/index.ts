import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt.util';
import { prisma } from '../config/database';
import { setupEmergencyHandlers } from './emergency.handler';

// WebSocket 伺服器實例
let io: Server | null = null;

// 用戶連線映射
const userSockets = new Map<string, Set<string>>();

// 初始化 WebSocket 伺服器
export const initializeWebSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // 認證中介軟體
  io.use(async (socket, next) => {
    try {
      const token = extractTokenFromHeader(socket.handshake.auth.token) ||
        socket.handshake.auth.token;

      if (!token) {
        return next(new Error('未提供認證 Token'));
      }

      const payload = verifyAccessToken(token);

      // 驗證用戶是否存在
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, role: true },
      });

      if (!user) {
        return next(new Error('用戶不存在'));
      }

      // 將用戶資訊附加到 socket
      socket.data.userId = user.id;
      socket.data.role = user.role;

      next();
    } catch (error: any) {
      next(new Error(error.message || '認證失敗'));
    }
  });

  // 連線處理
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`用戶連線: ${userId} (${socket.id})`);

    // 將 socket 加入用戶房間
    socket.join(`user:${userId}`);

    // 追蹤用戶的 socket 連線
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    // 加入角色房間
    socket.join(`role:${socket.data.role}`);

    // 處理加入特定房間
    socket.on('join:elder', (elderId: string) => {
      // 子女加入特定長輩的房間以接收即時更新
      if (socket.data.role === 'CHILD') {
        socket.join(`elder:${elderId}`);
        console.log(`子女 ${userId} 加入長輩 ${elderId} 的房間`);
      }
    });

    // 處理離開房間
    socket.on('leave:elder', (elderId: string) => {
      socket.leave(`elder:${elderId}`);
    });

    // 處理斷線
    socket.on('disconnect', (reason) => {
      console.log(`用戶斷線: ${userId} (${reason})`);

      // 移除 socket 追蹤
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    });

    // 錯誤處理
    socket.on('error', (error) => {
      console.error(`Socket 錯誤 (${userId}):`, error);
    });
  });

  // 設置緊急求助處理器
  setupEmergencyHandlers(io);

  console.log('WebSocket 伺服器初始化完成');
  return io;
};

// 取得 WebSocket 伺服器實例
export const getIO = (): Server => {
  if (!io) {
    throw new Error('WebSocket 伺服器尚未初始化');
  }
  return io;
};

// 發送事件給特定用戶
export const emitToUser = (userId: string, event: string, data: any): void => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

// 發送事件給多個用戶
export const emitToUsers = (userIds: string[], event: string, data: any): void => {
  if (!io) return;
  userIds.forEach((userId) => {
    io!.to(`user:${userId}`).emit(event, data);
  });
};

// 發送事件給特定長輩的所有監控者（子女）
export const emitToElderWatchers = (elderId: string, event: string, data: any): void => {
  if (!io) return;
  io.to(`elder:${elderId}`).emit(event, data);
};

// 發送事件給所有長輩
export const emitToAllElders = (event: string, data: any): void => {
  if (!io) return;
  io.to('role:ELDER').emit(event, data);
};

// 發送事件給所有子女
export const emitToAllChildren = (event: string, data: any): void => {
  if (!io) return;
  io.to('role:CHILD').emit(event, data);
};

// 檢查用戶是否在線
export const isUserOnline = (userId: string): boolean => {
  return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
};

// 取得用戶的 socket 數量
export const getUserSocketCount = (userId: string): number => {
  return userSockets.get(userId)?.size || 0;
};

// 廣播緊急求助
export const broadcastEmergency = async (
  elderId: string,
  elderName: string,
  location?: { latitude: number; longitude: number }
): Promise<void> => {
  if (!io) return;

  // 取得所有綁定的子女
  const bindings = await prisma.binding.findMany({
    where: {
      elderId,
      confirmedAt: { not: null },
    },
    select: { childId: true },
  });

  const emergencyData = {
    type: 'EMERGENCY',
    elderId,
    elderName,
    location,
    timestamp: new Date().toISOString(),
  };

  // 發送給長輩房間的所有監控者
  io.to(`elder:${elderId}`).emit('emergency', emergencyData);

  // 同時發送給每個子女的個人房間（確保收到）
  bindings.forEach((binding) => {
    io!.to(`user:${binding.childId}`).emit('emergency', emergencyData);
  });

  console.log(`緊急求助廣播: 長輩 ${elderId}, 子女數: ${bindings.length}`);
};

// 取消緊急求助廣播
export const broadcastEmergencyCancel = async (
  elderId: string,
  elderName: string
): Promise<void> => {
  if (!io) return;

  const cancelData = {
    type: 'EMERGENCY_CANCEL',
    elderId,
    elderName,
    timestamp: new Date().toISOString(),
  };

  // 發送給長輩房間的所有監控者
  io.to(`elder:${elderId}`).emit('emergency:cancel', cancelData);

  // 取得所有綁定的子女
  const bindings = await prisma.binding.findMany({
    where: {
      elderId,
      confirmedAt: { not: null },
    },
    select: { childId: true },
  });

  bindings.forEach((binding) => {
    io!.to(`user:${binding.childId}`).emit('emergency:cancel', cancelData);
  });
};
