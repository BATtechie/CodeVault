import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import authController from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

router.get('/me', authMiddleware, authController.getProfile);
router.put('/me', authMiddleware, authController.updateProfile);
router.post('/2fa/setup', authMiddleware, authController.setupTwoFactor);
router.post('/2fa/enable', authMiddleware, authController.enableTwoFactor);
router.post('/2fa/disable', authMiddleware, authController.disableTwoFactor);

// Alias for getProfile
router.get('/verify', authMiddleware, authController.getProfile);

export default router;
