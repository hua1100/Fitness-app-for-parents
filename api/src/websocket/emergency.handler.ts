import { Server, Socket } from 'socket.io';
import { prisma } from '../config/database';
import { sendPushToUsers } from '../utils/fcm.util';
import { NotificationService } from '../services/notification.service';
import { emitToUser, emitToUsers } from './index';

// 緊急求助處理器
export const setupEmergencyHandlers = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    const userRole = socket.data.role;

    // 長輩觸發緊急求助
    socket.on('emergency:trigger', async (data: {
      location?: { latitude: number; longitude: number };
    }) => {
      if (userRole !== 'ELDER') {
        socket.emit('error', { message: '只有長輩可以觸發緊急求助' });
        return;
      }

      try {
        // 取得長輩資訊
        const elder = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true },
        });

        if (!elder) {
          socket.emit('error', { message: '用戶不存在' });
          return;
        }

        // 取得所有綁定的子女
        const bindings = await prisma.binding.findMany({
          where: {
            elderId: userId,
            confirmedAt: { not: null },
          },
          select: { childId: true },
        });

        if (bindings.length === 0) {
          socket.emit('error', { message: '尚未綁定任何子女' });
          return;
        }

        const childIds = bindings.map(b => b.childId);
        const emergencyData = {
          type: 'EMERGENCY',
          elderId: userId,
          elderName: elder.name,
          location: data.location,
          timestamp: new Date().toISOString(),
        };

        // 透過 WebSocket 即時發送給所有子女
        emitToUsers(childIds, 'emergency', emergencyData);

        // 同時發送 FCM 推播通知（確保離線也能收到）
        await sendPushToUsers(childIds, {
          title: '🚨 緊急求助',
          body: `${elder.name} 發出了緊急求助！`,
          data: {
            type: 'EMERGENCY',
            elderId: userId,
            elderName: elder.name,
            latitude: data.location?.latitude?.toString() || '',
            longitude: data.location?.longitude?.toString() || '',
          },
        });

        // 建立通知記錄
        await NotificationService.createNotifications(
          childIds,
          'EMERGENCY',
          '緊急求助',
          `${elder.name} 發出了緊急求助！`,
          emergencyData
        );

        // 更新當前運動記錄的緊急求助狀態
        await prisma.exerciseRecord.updateMany({
          where: {
            elderId: userId,
            endTime: null,
          },
          data: {
            emergencyTriggered: true,
          },
        });

        // 確認發送成功
        socket.emit('emergency:triggered', {
          success: true,
          notifiedCount: childIds.length,
          timestamp: emergencyData.timestamp,
        });

        console.log(`緊急求助觸發: 長輩 ${userId}, 通知子女數: ${childIds.length}`);
      } catch (error) {
        console.error('緊急求助處理失敗:', error);
        socket.emit('error', { message: '緊急求助發送失敗，請重試' });
      }
    });

    // 長輩取消緊急求助
    socket.on('emergency:cancel', async () => {
      if (userRole !== 'ELDER') {
        socket.emit('error', { message: '只有長輩可以取消緊急求助' });
        return;
      }

      try {
        // 取得長輩資訊
        const elder = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true },
        });

        if (!elder) {
          socket.emit('error', { message: '用戶不存在' });
          return;
        }

        // 取得所有綁定的子女
        const bindings = await prisma.binding.findMany({
          where: {
            elderId: userId,
            confirmedAt: { not: null },
          },
          select: { childId: true },
        });

        const childIds = bindings.map(b => b.childId);
        const cancelData = {
          type: 'EMERGENCY_CANCEL',
          elderId: userId,
          elderName: elder.name,
          timestamp: new Date().toISOString(),
        };

        // 透過 WebSocket 發送取消通知
        emitToUsers(childIds, 'emergency:cancel', cancelData);

        // 發送 FCM 推播
        await sendPushToUsers(childIds, {
          title: '緊急求助已取消',
          body: `${elder.name} 已取消緊急求助`,
          data: {
            type: 'EMERGENCY_CANCEL',
            elderId: userId,
            elderName: elder.name,
          },
        });

        // 更新運動記錄
        await prisma.exerciseRecord.updateMany({
          where: {
            elderId: userId,
            endTime: null,
            emergencyTriggered: true,
          },
          data: {
            emergencyTriggered: false,
          },
        });

        socket.emit('emergency:cancelled', {
          success: true,
          timestamp: cancelData.timestamp,
        });

        console.log(`緊急求助取消: 長輩 ${userId}`);
      } catch (error) {
        console.error('取消緊急求助失敗:', error);
        socket.emit('error', { message: '取消失敗，請重試' });
      }
    });

    // 子女確認收到緊急求助
    socket.on('emergency:acknowledge', async (data: { elderId: string }) => {
      if (userRole !== 'CHILD') {
        socket.emit('error', { message: '只有子女可以確認緊急求助' });
        return;
      }

      try {
        // 取得子女資訊
        const child = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });

        // 通知長輩子女已收到警報
        emitToUser(data.elderId, 'emergency:acknowledged', {
          childId: userId,
          childName: child?.name || '子女',
          timestamp: new Date().toISOString(),
        });

        socket.emit('emergency:ack-confirmed', { success: true });
      } catch (error) {
        console.error('確認緊急求助失敗:', error);
      }
    });
  });
};

export default setupEmergencyHandlers;
