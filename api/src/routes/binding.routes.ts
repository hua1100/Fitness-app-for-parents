import { Router } from 'express';
import { z } from 'zod';
import {
  generateCode,
  useCode,
  confirmBinding,
  getBindings,
  getPendingBindings,
  unbind,
  rejectBinding,
} from '../controllers/binding.controller';
import { authenticate, elderOnly, childOnly } from '../middlewares/auth.middleware';
import { validate, bindingCodeSchema, idSchema } from '../middlewares/validation.middleware';

const router = Router();

// 所有路由都需要認證
router.use(authenticate);

// 驗證 Schema
const useCodeSchema = z.object({
  code: bindingCodeSchema,
});

const bindingIdSchema = z.object({
  bindingId: idSchema,
});

// 長輩專用路由
router.post('/generate-code', elderOnly, generateCode);
router.post('/confirm', elderOnly, validate(bindingIdSchema), confirmBinding);
router.post('/reject', elderOnly, validate(bindingIdSchema), rejectBinding);
router.get('/pending', elderOnly, getPendingBindings);

// 子女專用路由
router.post('/use-code', childOnly, validate(useCodeSchema), useCode);

// 通用路由
router.get('/', getBindings);
router.delete('/:bindingId', unbind);

export default router;
