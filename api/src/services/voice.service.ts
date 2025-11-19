/**
 * 語音服務
 * 處理語音訊息上傳、播放和管理相關業務邏輯
 */

import { PrismaClient } from '@prisma/client';
import { uploadToS3, deleteFromS3 } from '../utils/s3.util';
import { NotificationService } from './notification.service';

const prisma = new PrismaClient();

// 配置常數
const VOICE_MAX_COUNT_PER_ELDER = 20;
const VOICE_MAX_DURATION_SECONDS = 30;
const VOICE_MAX_FILE_SIZE_MB = 5;

// 系統預設語音
const DEFAULT_VOICES = [
  {
    id: 'default-1',
    name: '加油鼓勵',
    text: '您做得很好，繼續保持！',
    fileUrl: '/audio/default/encouragement-1.mp3',
  },
  {
    id: 'default-2',
    name: '運動提醒',
    text: '記得保持呼吸均勻，慢慢來！',
    fileUrl: '/audio/default/reminder-1.mp3',
  },
  {
    id: 'default-3',
    name: '健康祝福',
    text: '運動讓身體更健康，您真棒！',
    fileUrl: '/audio/default/blessing-1.mp3',
  },
  {
    id: 'default-4',
    name: '休息提醒',
    text: '累了就休息一下，不要勉強自己！',
    fileUrl: '/audio/default/rest-1.mp3',
  },
];

export const VoiceService = {
  /**
   * 上傳語音訊息
   */
  async uploadVoice(
    senderId: string,
    receiverId: string,
    fileBuffer: Buffer,
    duration: number,
    fileName: string
  ) {
    // 驗證發送者是子女
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
    });

    if (!sender || sender.role !== 'CHILD') {
      throw new Error('只有子女可以上傳語音');
    }

    // 驗證綁定關係
    const binding = await prisma.elderChildBinding.findFirst({
      where: {
        childId: senderId,
        elderId: receiverId,
        status: 'CONFIRMED',
      },
    });

    if (!binding) {
      throw new Error('尚未與該長輩綁定');
    }

    // 檢查配額
    const currentCount = await prisma.voiceMessage.count({
      where: {
        senderId,
        receiverId,
        isActive: true,
      },
    });

    if (currentCount >= VOICE_MAX_COUNT_PER_ELDER) {
      throw new Error(`每位長輩最多只能有 ${VOICE_MAX_COUNT_PER_ELDER} 段語音`);
    }

    // 驗證時長
    if (duration > VOICE_MAX_DURATION_SECONDS) {
      throw new Error(`語音時長不能超過 ${VOICE_MAX_DURATION_SECONDS} 秒`);
    }

    // 驗證檔案大小
    const fileSizeMB = fileBuffer.length / (1024 * 1024);
    if (fileSizeMB > VOICE_MAX_FILE_SIZE_MB) {
      throw new Error(`檔案大小不能超過 ${VOICE_MAX_FILE_SIZE_MB}MB`);
    }

    // 上傳到 S3
    const s3Path = `voices/${senderId}/${receiverId}/${Date.now()}_${fileName}`;
    const fileUrl = await uploadToS3(fileBuffer, s3Path, {
      contentType: 'audio/aac',
    });

    // 建立語音記錄
    const voiceMessage = await prisma.voiceMessage.create({
      data: {
        senderId,
        receiverId,
        fileUrl,
        duration,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 發送通知給長輩
    await NotificationService.sendNotification({
      userIds: [receiverId],
      type: 'VOICE_NEW',
      title: '新語音鼓勵',
      body: `${sender.name} 為您錄製了一段鼓勵語音`,
      data: {
        voiceId: voiceMessage.id,
        senderId,
        senderName: sender.name,
      },
    });

    // 取得更新後的配額
    const quota = await this.getQuota(senderId, receiverId);

    return {
      voiceMessage,
      quota,
    };
  },

  /**
   * 取得語音列表
   */
  async getVoiceList(
    userId: string,
    options: {
      elderId?: string;
      childId?: string;
      sortBy?: 'createdAt' | 'playCount' | 'duration';
      order?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    } = {}
  ) {
    const {
      elderId,
      childId,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = options;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('用戶不存在');
    }

    // 建立查詢條件
    const where: any = {
      isActive: true,
    };

    if (user.role === 'ELDER') {
      where.receiverId = userId;
      if (childId) {
        where.senderId = childId;
      }
    } else {
      where.senderId = userId;
      if (elderId) {
        where.receiverId = elderId;
      }
    }

    // 查詢語音列表
    const [voices, total] = await Promise.all([
      prisma.voiceMessage.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.voiceMessage.count({ where }),
    ]);

    // 計算統計
    const stats = await prisma.voiceMessage.aggregate({
      where,
      _count: true,
      _sum: {
        duration: true,
        playCount: true,
      },
    });

    return {
      voices,
      stats: {
        totalCount: stats._count,
        totalDuration: stats._sum.duration || 0,
        totalPlays: stats._sum.playCount || 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * 取得語音詳情
   */
  async getVoiceDetail(voiceId: string, userId: string) {
    const voice = await prisma.voiceMessage.findUnique({
      where: { id: voiceId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!voice) {
      throw new Error('語音不存在');
    }

    if (!voice.isActive) {
      throw new Error('語音已被刪除');
    }

    // 驗證存取權限
    if (voice.senderId !== userId && voice.receiverId !== userId) {
      throw new Error('無權存取此語音');
    }

    return voice;
  },

  /**
   * 記錄播放
   */
  async recordPlay(voiceId: string, userId: string) {
    const voice = await prisma.voiceMessage.findUnique({
      where: { id: voiceId },
    });

    if (!voice || !voice.isActive) {
      throw new Error('語音不存在');
    }

    // 驗證存取權限
    if (voice.senderId !== userId && voice.receiverId !== userId) {
      throw new Error('無權播放此語音');
    }

    // 更新播放次數
    const updated = await prisma.voiceMessage.update({
      where: { id: voiceId },
      data: {
        playCount: {
          increment: 1,
        },
      },
    });

    return {
      playCount: updated.playCount,
      lastPlayedAt: new Date().toISOString(),
    };
  },

  /**
   * 刪除語音
   */
  async deleteVoice(voiceId: string, userId: string) {
    const voice = await prisma.voiceMessage.findUnique({
      where: { id: voiceId },
    });

    if (!voice) {
      throw new Error('語音不存在');
    }

    // 只有創建者可以刪除
    if (voice.senderId !== userId) {
      throw new Error('只有創建者可以刪除語音');
    }

    // 軟刪除
    await prisma.voiceMessage.update({
      where: { id: voiceId },
      data: { isActive: false },
    });

    // 從 S3 刪除檔案
    try {
      await deleteFromS3(voice.fileUrl);
    } catch (error) {
      console.error('刪除 S3 檔案失敗:', error);
    }

    return { success: true };
  },

  /**
   * 批次刪除語音
   */
  async batchDelete(voiceIds: string[], userId: string) {
    // 驗證所有語音都屬於該用戶
    const voices = await prisma.voiceMessage.findMany({
      where: {
        id: { in: voiceIds },
        senderId: userId,
        isActive: true,
      },
    });

    if (voices.length !== voiceIds.length) {
      throw new Error('部分語音不存在或無權刪除');
    }

    // 批次軟刪除
    await prisma.voiceMessage.updateMany({
      where: {
        id: { in: voiceIds },
      },
      data: { isActive: false },
    });

    // 從 S3 刪除檔案
    for (const voice of voices) {
      try {
        await deleteFromS3(voice.fileUrl);
      } catch (error) {
        console.error('刪除 S3 檔案失敗:', error);
      }
    }

    return {
      deletedCount: voices.length,
    };
  },

  /**
   * 取得配額資訊
   */
  async getQuota(childId: string, elderId: string) {
    const currentCount = await prisma.voiceMessage.count({
      where: {
        senderId: childId,
        receiverId: elderId,
        isActive: true,
      },
    });

    return {
      used: currentCount,
      limit: VOICE_MAX_COUNT_PER_ELDER,
      remaining: VOICE_MAX_COUNT_PER_ELDER - currentCount,
    };
  },

  /**
   * 取得隨機語音（運動播放）
   */
  async getRandomVoice(elderId: string, excludeIds: string[] = []) {
    const where: any = {
      receiverId: elderId,
      isActive: true,
    };

    if (excludeIds.length > 0) {
      where.id = { notIn: excludeIds };
    }

    // 取得符合條件的語音數量
    const count = await prisma.voiceMessage.count({ where });

    if (count === 0) {
      return null;
    }

    // 隨機取一個
    const randomIndex = Math.floor(Math.random() * count);
    const voice = await prisma.voiceMessage.findFirst({
      where,
      skip: randomIndex,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return voice;
  },

  /**
   * 取得系統預設語音
   */
  async getDefaultVoices() {
    return DEFAULT_VOICES;
  },
};
