import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import authController from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.get('/me', authMiddleware, authController.getProfile);
router.put('/me', authMiddleware, authController.updateProfile);
router.post('/logout', authMiddleware, authController.logout);

// Alias for getProfile
router.get('/verify', authMiddleware, authController.getProfile);

export default router;
