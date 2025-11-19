import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '長輩健身 App API',
      version: '1.0.0',
      description: '長輩健身應用程式後端 API 文檔',
      contact: {
        name: 'API 支援',
        email: 'support@fitness-app.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '開發環境',
      },
      {
        url: 'https://api.fitness-app.com',
        description: '生產環境',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '使用 JWT Token 進行認證',
        },
      },
      schemas: {
        // 通用回應
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        // 用戶
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            phone: { type: 'string', example: '0912345678' },
            name: { type: 'string', example: '王小明' },
            role: { type: 'string', enum: ['ELDER', 'CHILD'] },
            avatarUrl: { type: 'string', nullable: true },
            totalPoints: { type: 'integer', example: 100 },
            bindingCode: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Token
        Tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        // 運動記錄
        ExerciseRecord: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time', nullable: true },
            durationMinutes: { type: 'integer', nullable: true },
            status: { type: 'string', enum: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
            pointsEarned: { type: 'integer' },
            note: { type: 'string', nullable: true },
            emergencyStatus: { type: 'string', enum: ['NONE', 'ACTIVE', 'RESOLVED', 'CANCELLED'], nullable: true },
            emergencyLat: { type: 'number', nullable: true },
            emergencyLng: { type: 'number', nullable: true },
          },
        },
        // 綁定關係
        Binding: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            elderId: { type: 'string', format: 'uuid' },
            childId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // 通知
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            type: { type: 'string' },
            title: { type: 'string' },
            body: { type: 'string' },
            read: { type: 'boolean' },
            data: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // 獎勵
        Reward: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            pointsCost: { type: 'integer' },
            imageUrl: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // 獎勵兌換記錄
        RedemptionRecord: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            rewardId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'CANCELLED'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // 成就
        Achievement: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            iconUrl: { type: 'string', nullable: true },
            condition: { type: 'object' },
            pointsBonus: { type: 'integer' },
          },
        },
        // 語音訊息
        VoiceMessage: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            senderId: { type: 'string', format: 'uuid' },
            receiverId: { type: 'string', format: 'uuid' },
            audioUrl: { type: 'string' },
            duration: { type: 'integer' },
            playCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // 分頁資訊
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    tags: [
      { name: '認證', description: '用戶認證相關 API' },
      { name: '運動', description: '運動記錄相關 API' },
      { name: '綁定', description: '長輩子女綁定相關 API' },
      { name: '通知', description: '通知相關 API' },
      { name: '獎勵', description: '獎勵系統相關 API' },
      { name: '成就', description: '成就系統相關 API' },
      { name: '語音', description: '語音訊息相關 API' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/docs/*.yaml'],
};

const swaggerSpec = swaggerJsdoc(options);

// 設定 Swagger UI
export const setupSwagger = (app: Express): void => {
  // Swagger JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: '長輩健身 App API 文檔',
    })
  );
};

export default swaggerSpec;
