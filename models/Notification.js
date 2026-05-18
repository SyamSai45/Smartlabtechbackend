import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Type of notification
  type: {
    type: String,
    enum: ['contact', 'quote', 'order', 'system'],
    required: true
  },
  
  // Title of notification
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  // Message content
  message: {
    type: String,
    required: true,
    trim: true
  },
  
  // Reference to the source document
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel',
    required: true
  },
  
  referenceModel: {
    type: String,
    enum: ['Contact', 'Quote'],
    required: true
  },
  
  // Notification status
  isRead: {
    type: Boolean,
    default: false
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // For admin
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Additional data
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });


const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;