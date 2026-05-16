import mongoose from 'mongoose';

// Subject Schema
const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Contact Hero Schema
const contactHeroSchema = new mongoose.Schema({
  title: {
    type: String, 
    required: [true, 'Contact hero title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Contact hero tag is required'],
    trim: true
  },
  description: {
    type: String, 
    required: [true, 'Contact hero description is required'],
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Contact hero image is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Contact Page Schema
const contactPageSchema = new mongoose.Schema({
  hero: contactHeroSchema,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Main Contact Schema (No indexes)
const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  subjectName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'read', 'replied', 'archived'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Create models
const Subject = mongoose.model('Subject', subjectSchema);
const Contact = mongoose.model('Contact', contactSchema);
const ContactPage = mongoose.model('ContactPage', contactPageSchema);

// Export all models
export { Subject, Contact, ContactPage };