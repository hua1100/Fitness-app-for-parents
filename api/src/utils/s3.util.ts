import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, getS3BucketName, getS3UrlPrefix, isS3Configured } from '../config/aws';
import { randomUUID } from 'crypto';

// 上傳選項
export interface UploadOptions {
  folder?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

// 上傳檔案到 S3
export const uploadToS3 = async (
  buffer: Buffer,
  filename: string,
  options: UploadOptions = {}
): Promise<string> => {
  if (!isS3Configured()) {
    throw new Error('S3 未配置，無法上傳檔案');
  }

  const s3Client = getS3Client();
  const bucketName = getS3BucketName();

  // 生成唯一的檔案名
  const ext = filename.split('.').pop() || '';
  const uniqueFilename = `${randomUUID()}.${ext}`;
  const key = options.folder
    ? `${options.folder}/${uniqueFilename}`
    : uniqueFilename;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: options.contentType || 'application/octet-stream',
    Metadata: options.metadata,
  });

  await s3Client.send(command);

  // 返回檔案 URL
  const fileUrl = `${getS3UrlPrefix()}/${key}`;
  console.log('檔案上傳成功:', fileUrl);

  return fileUrl;
};

// 從 S3 刪除檔案
export const deleteFromS3 = async (fileUrl: string): Promise<boolean> => {
  if (!isS3Configured()) {
    console.warn('S3 未配置，無法刪除檔案');
    return false;
  }

  try {
    const s3Client = getS3Client();
    const bucketName = getS3BucketName();

    // 從 URL 提取 key
    const urlPrefix = getS3UrlPrefix();
    const key = fileUrl.replace(`${urlPrefix}/`, '');

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
    console.log('檔案刪除成功:', key);

    return true;
  } catch (error) {
    console.error('檔案刪除失敗:', error);
    return false;
  }
};

// 生成預簽名上傳 URL
export const getPresignedUploadUrl = async (
  filename: string,
  contentType: string,
  folder?: string,
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; fileUrl: string }> => {
  if (!isS3Configured()) {
    throw new Error('S3 未配置，無法生成上傳 URL');
  }

  const s3Client = getS3Client();
  const bucketName = getS3BucketName();

  // 生成唯一的檔案名
  const ext = filename.split('.').pop() || '';
  const uniqueFilename = `${randomUUID()}.${ext}`;
  const key = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const fileUrl = `${getS3UrlPrefix()}/${key}`;

  return { uploadUrl, fileUrl };
};

// 生成預簽名下載 URL
export const getPresignedDownloadUrl = async (
  fileUrl: string,
  expiresIn: number = 3600
): Promise<string> => {
  if (!isS3Configured()) {
    throw new Error('S3 未配置，無法生成下載 URL');
  }

  const s3Client = getS3Client();
  const bucketName = getS3BucketName();

  // 從 URL 提取 key
  const urlPrefix = getS3UrlPrefix();
  const key = fileUrl.replace(`${urlPrefix}/`, '');

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

// 上傳語音檔案（專用）
export const uploadVoiceFile = async (
  buffer: Buffer,
  senderId: string,
  receiverId: string
): Promise<string> => {
  return uploadToS3(buffer, 'voice.aac', {
    folder: `voices/${senderId}/${receiverId}`,
    contentType: 'audio/aac',
    metadata: {
      senderId,
      receiverId,
      uploadedAt: new Date().toISOString(),
    },
  });
};

// 上傳頭像（專用）
export const uploadAvatar = async (
  buffer: Buffer,
  userId: string,
  contentType: string
): Promise<string> => {
  const ext = contentType.split('/')[1] || 'jpg';
  return uploadToS3(buffer, `avatar.${ext}`, {
    folder: `avatars/${userId}`,
    contentType,
    metadata: {
      userId,
      uploadedAt: new Date().toISOString(),
    },
  });
};
