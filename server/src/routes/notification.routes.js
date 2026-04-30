import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import notificationController from '../controllers/notification.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', notificationController.listNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

export default router;
