/**
 * 語音路由
 */

import { Router } from 'express';
import multer from 'multer';
import {
  uploadVoice,
  getVoiceList,
  getVoiceDetail,
  recordPlay,
  deleteVoice,
  batchDelete,
  getQuota,
  getRandomVoice,
  getDefaultVoices,
} from '../controllers/voice.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// 配置 multer 用於檔案上傳
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // 驗證檔案類型
    const allowedMimes = ['audio/aac', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支援的音訊格式'));
    }
  },
});

// 所有路由都需要認證
router.use(authenticate);

// 系統預設語音（所有人）
router.get('/default', getDefaultVoices);

// 隨機語音（長輩專用）
router.get('/random', authorize('ELDER'), getRandomVoice);

// 配額資訊（子女專用）
router.get('/quota', authorize('CHILD'), getQuota);

// 批次刪除（子女專用）
router.post('/batch-delete', authorize('CHILD'), batchDelete);

// 語音列表（所有人）
router.get('/', getVoiceList);

// 上傳語音（子女專用）
router.post('/', authorize('CHILD'), upload.single('voice'), uploadVoice);

// 語音詳情（所有人）
router.get('/:voiceId', getVoiceDetail);

// 記錄播放（所有人）
router.post('/:voiceId/play', recordPlay);

// 刪除語音（僅創建者）
router.delete('/:voiceId', deleteVoice);

export default router;
