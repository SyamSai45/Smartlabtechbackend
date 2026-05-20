import Notification from '../models/Notification.js';
import { Contact } from '../models/Contact.js';
import Quote from '../models/Quote.js';
import { ServiceForm } from '../models/ServicePage.js';

// Helper: Create notification with dynamic template
export const createNotification = async (type, referenceId, referenceModel, data) => {
  try {
    const templates = {
      contact: {
        title: 'New Contact Form Submission',
        message: `${data.name} (${data.email}) has submitted a contact form. Subject: ${data.subjectName}`,
        priority: 'high'
      },
      quote: {
        title: 'New Quote Request',
        message: `${data.name} (${data.company}) has requested a quote for ${data.quantity} x ${data.productName}`,
        priority: 'urgent'
      },
      service: {
        title: 'New Service Request',
        message: `${data.contactPerson} (${data.companyDetails}) has submitted a service request for ${data.instrumentType} (Model: ${data.modelNo})`,
        priority: 'urgent'
      }
    };
    
    const template = templates[type];
    if (!template) return null;
    
    const notification = await Notification.create({
      type, title: template.title, message: template.message,
      referenceId, referenceModel, priority: template.priority,
      data, isRead: false, isActive: true
    });
    
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

// Helper: Get notifications with pagination
const getNotifications = async (query, page, limit) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [notifications, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).limit(parseInt(limit)).skip(skip),
    Notification.countDocuments(query)
  ]);
  return { notifications, total };
};

// Helper: Build query
const buildQuery = (req) => {
  const { isRead, type } = req.query;
  const query = { isActive: true };
  if (isRead !== undefined) query.isRead = isRead === 'true';
  if (type) query.type = type;
  return query;
};

// ==================== NOTIFICATION CRUD ====================

export const getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const query = buildQuery(req);
    const { notifications, total } = await getNotifications(query, page, limit);
    const unreadCount = await Notification.countDocuments({ isRead: false, isActive: true });
    
    res.json({
      success: true, data: notifications, unreadCount,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNotificationsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const validTypes = ['contact', 'quote', 'service', 'order', 'system'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid notification type' });
    }
    
    const { notifications, total } = await getNotifications({ type, isActive: true }, page, limit);
    res.json({
      success: true, data: notifications,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ isRead: false, isActive: true });
    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false, isActive: true }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Soft delete
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany({ isRead: true, isActive: true }, { isActive: false });
    res.json({ success: true, message: `${result.modifiedCount} read notifications deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Hard delete
export const permanentDeleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Notification permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};