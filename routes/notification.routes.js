import express from 'express';
import {
  getAllNotifications,
  getNotificationsByType,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  permanentDeleteNotification
} from '../controllers/notification.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/', getAllNotifications);
router.get('/unread/count', getUnreadCount);
router.get('/type/:type', getNotificationsByType);
router.get('/:id', getNotificationById);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/read/all', deleteAllRead);
router.delete('/:id/permanent', permanentDeleteNotification);
router.delete('/:id', deleteNotification);

export default router;