import Notification from '../models/Notification.js';
import { Contact } from '../models/Contact.js';
import Quote from '../models/Quote.js';
import {ServiceForm} from '../models/ServicePage.js';

// Helper: Create notification
export const createNotification = async (type, referenceId, referenceModel, data) => {
  try {
    let title = '';
    let message = '';
    let priority = 'medium';
    
    if (type === 'contact') {
      title = `New Contact Form Submission`;
      message = `${data.name} (${data.email}) has submitted a contact form. Subject: ${data.subjectName}`;
      priority = 'high';
    } else if (type === 'quote') {
      title = `New Quote Request`;
      message = `${data.name} (${data.company}) has requested a quote for ${data.quantity} x ${data.productName}`;
      priority = 'urgent';
    } else if (type === 'service') {
      title = `New Service Request`;
      message = `${data.contactPerson} (${data.companyDetails}) has submitted a service request for ${data.instrumentType} (Model: ${data.modelNo})`;
      priority = 'urgent';
    }
    
    const notification = await Notification.create({
      type,
      title,
      message,
      referenceId,
      referenceModel,
      priority,
      data,
      isRead: false,
      isActive: true
    });
    
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

// @desc    Get all notifications (Admin)
// @route   GET /api/notifications
export const getAllNotifications = async (req, res) => {
  try {
    const { isRead, type, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    if (type) query.type = type;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ isRead: false, isActive: true });
    
    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get notifications by type (Admin)
// @route   GET /api/notifications/type/:type
export const getNotificationsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const validTypes = ['contact', 'quote', 'service', 'order', 'system'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid notification type' });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const notifications = await Notification.find({ type, isActive: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Notification.countDocuments({ type, isActive: true });
    
    res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get unread notifications count (Admin)
// @route   GET /api/notifications/unread/count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ isRead: false, isActive: true });
    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false, isActive: true }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete notification (soft delete)
// @route   DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete all read notifications (soft delete)
// @route   DELETE /api/notifications/read/all
export const deleteAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { isRead: true, isActive: true },
      { isActive: false }
    );
    res.json({ success: true, message: `${result.modifiedCount} read notifications deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Permanent delete notification (hard delete)
// @route   DELETE /api/notifications/:id/permanent
export const permanentDeleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};