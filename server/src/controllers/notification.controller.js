import prisma from '../db/prisma.js';
import { parsePagination, sendError, sendSuccess } from '../utils/http.js';

const notificationController = {
  async listNotifications(req, res) {
    try {
      const { page, limit, skip } = parsePagination(req.query, {
        limit: 10,
        maxLimit: 30,
      });

      const [notifications, unreadCount, total] = await prisma.$transaction([
        prisma.notification.findMany({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({
          where: {
            userId: req.user.id,
            readAt: null,
          },
        }),
        prisma.notification.count({
          where: { userId: req.user.id },
        }),
      ]);

      return sendSuccess(res, {
        data: notifications,
        meta: {
          page,
          limit,
          total,
          unreadCount,
        },
      });
    } catch (error) {
      console.error('List notifications error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to load notifications right now.',
      });
    }
  },

  async markAsRead(req, res) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: req.params.id,
          userId: req.user.id,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      if (notification.count === 0) {
        return sendError(res, {
          status: 404,
          message: 'Notification not found.',
        });
      }

      return sendSuccess(res, {
        message: 'Notification marked as read.',
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to update the notification right now.',
      });
    }
  },

  async markAllAsRead(req, res) {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: req.user.id,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      return sendSuccess(res, {
        message: 'All notifications marked as read.',
      });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to update notifications right now.',
      });
    }
  },
};

export default notificationController;
