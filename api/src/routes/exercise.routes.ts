import { Router } from 'express';
import { z } from 'zod';
import {
  startExercise,
  endExercise,
  getExercises,
  getStats,
  getCurrentExercise,
  triggerEmergency,
  cancelEmergency,
  getElderExercises,
  getElderStats,
} from '../controllers/exercise.controller';
import { authenticate, elderOnly, childOnly } from '../middlewares/auth.middleware';
import { validate, locationSchema, paginationSchema } from '../middlewares/validation.middleware';

const router = Router();

// 所有路由都需要認證
router.use(authenticate);

// 驗證 Schema
const endExerciseSchema = z.object({
  note: z.string().max(500).optional(),
});

const emergencySchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// 長輩專用路由
router.post('/start', elderOnly, startExercise);
router.post('/end', elderOnly, validate(endExerciseSchema), endExercise);
router.post('/emergency', elderOnly, validate(emergencySchema), triggerEmergency);
router.post('/emergency/cancel', elderOnly, cancelEmergency);

// 通用路由（長輩查看自己的記錄）
router.get('/', getExercises);
router.get('/stats', getStats);
router.get('/current', getCurrentExercise);

// 子女專用路由（查看長輩記錄）
router.get('/elder/:elderId', childOnly, getElderExercises);
router.get('/elder/:elderId/stats', childOnly, getElderStats);

export default router;
