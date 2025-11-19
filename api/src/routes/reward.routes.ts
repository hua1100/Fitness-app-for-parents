/**
 * 獎勵路由
 */

import { Router } from 'express';
import {
  getRewards,
  getRewardDetail,
  redeemReward,
  getRedeemedRewards,
  createCustomReward,
  updateCustomReward,
  deleteCustomReward,
  getUserPoints,
} from '../controllers/reward.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// 所有路由都需要認證
router.use(authenticate);

// 通用路由（長輩和子女都可使用）
router.get('/', getRewards);
router.get('/points', getUserPoints);
router.get('/redeemed', getRedeemedRewards);
router.get('/:rewardId', getRewardDetail);

// 長輩專用路由
router.post('/:rewardId/redeem', authorize('ELDER'), redeemReward);

// 子女專用路由
router.post('/', authorize('CHILD'), createCustomReward);
router.patch('/:rewardId', authorize('CHILD'), updateCustomReward);
router.delete('/:rewardId', authorize('CHILD'), deleteCustomReward);

export default router;
