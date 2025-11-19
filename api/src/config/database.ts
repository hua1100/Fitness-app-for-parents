import { PrismaClient } from '@prisma/client';

// 建立 Prisma Client 單例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 資料庫連線健康檢查
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('資料庫連線檢查失敗:', error);
    return false;
  }
};

// 關閉資料庫連線
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};
