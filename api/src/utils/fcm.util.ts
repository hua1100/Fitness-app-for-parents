import { getMessaging } from '../config/firebase';
import { prisma } from '../config/database';

// 通知資料介面
export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// 發送單一推播通知
export const sendPushNotification = async (
  token: string,
  notification: NotificationData
): Promise<string | null> => {
  try {
    const messaging = getMessaging();

    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.send(message);
    console.log('推播通知發送成功:', response);
    return response;
  } catch (error: any) {
    console.error('推播通知發送失敗:', error);

    // 處理無效的 token
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      // 移除無效的 token
      await prisma.deviceToken.deleteMany({
        where: { token },
      });
      console.log('已移除無效的裝置 Token');
    }

    return null;
  }
};

// 發送推播給多個裝置
export const sendMulticastNotification = async (
  tokens: string[],
  notification: NotificationData
): Promise<{ successCount: number; failureCount: number }> => {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  try {
    const messaging = getMessaging();

    const message = {
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);

    // 處理失敗的 token
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      // 移除無效的 tokens
      if (failedTokens.length > 0) {
        await prisma.deviceToken.deleteMany({
          where: { token: { in: failedTokens } },
        });
        console.log(`已移除 ${failedTokens.length} 個無效的裝置 Token`);
      }
    }

    console.log(
      `推播通知: 成功 ${response.successCount}, 失敗 ${response.failureCount}`
    );

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('批次推播通知發送失敗:', error);
    return { successCount: 0, failureCount: tokens.length };
  }
};

// 發送推播給指定用戶
export const sendPushToUser = async (
  userId: string,
  notification: NotificationData
): Promise<boolean> => {
  // 取得用戶的所有裝置 Token
  const deviceTokens = await prisma.deviceToken.findMany({
    where: { userId },
    select: { token: true },
  });

  if (deviceTokens.length === 0) {
    console.log(`用戶 ${userId} 沒有註冊任何裝置`);
    return false;
  }

  const tokens = deviceTokens.map((dt) => dt.token);
  const result = await sendMulticastNotification(tokens, notification);

  return result.successCount > 0;
};

// 發送推播給多個用戶
export const sendPushToUsers = async (
  userIds: string[],
  notification: NotificationData
): Promise<{ successCount: number; failureCount: number }> => {
  // 取得所有用戶的裝置 Token
  const deviceTokens = await prisma.deviceToken.findMany({
    where: { userId: { in: userIds } },
    select: { token: true },
  });

  if (deviceTokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  const tokens = deviceTokens.map((dt) => dt.token);
  return sendMulticastNotification(tokens, notification);
};
