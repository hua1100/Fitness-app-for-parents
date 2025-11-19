import { Router } from 'express';
import {
  getLineAuthUrl,
  lineCallback,
  lineLogin,
  getGoogleAuthUrl,
  googleCallback,
  googleLogin,
} from '../controllers/oauth.controller';

const router = Router();

// Line OAuth
router.get('/line/auth-url', getLineAuthUrl);
router.get('/line/callback', lineCallback);
router.post('/line/login', lineLogin);

// Google OAuth
router.get('/google/auth-url', getGoogleAuthUrl);
router.get('/google/callback', googleCallback);
router.post('/google/login', googleLogin);

export default router;
