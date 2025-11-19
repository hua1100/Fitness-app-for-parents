import { S3Client } from '@aws-sdk/client-s3';

// AWS S3 配置
let s3Client: S3Client | null = null;

export const getS3Client = (): S3Client => {
  if (s3Client) {
    return s3Client;
  }

  const region = process.env.AWS_REGION || 'ap-northeast-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    console.warn('AWS 憑證未配置，S3 功能將無法使用');
    // 返回一個基本的 client 用於開發環境
    s3Client = new S3Client({
      region,
    });
    return s3Client;
  }

  s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  console.log('AWS S3 Client 初始化成功');
  return s3Client;
};

// S3 Bucket 名稱
export const getS3BucketName = (): string => {
  return process.env.AWS_S3_BUCKET || 'fitness-app-voices';
};

// S3 URL 前綴
export const getS3UrlPrefix = (): string => {
  const bucket = getS3BucketName();
  const region = process.env.AWS_REGION || 'ap-northeast-1';
  return `https://${bucket}.s3.${region}.amazonaws.com`;
};

// 檢查 S3 配置是否完整
export const isS3Configured = (): boolean => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
};

// 初始化
getS3Client();
