import express from 'express';
import {
  getAllNotifications,
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



// Get routes
router.get('/', getAllNotifications);
router.get('/unread/count', getUnreadCount);
router.get('/:id', getNotificationById);

// Update routes
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

// Delete routes
router.delete('/:id', deleteNotification);
router.delete('/read/all', deleteAllRead);
router.delete('/:id/permanent', permanentDeleteNotification);

export default router;