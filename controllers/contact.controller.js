import { Subject, Contact, ContactPage } from '../models/Contact.js';
import Notification from '../models/Notification.js';
import { createNotification } from './notification.controller.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Save uploaded file
const saveFile = async (file, folder) => {
  if (!file) return null;
  
  if (typeof file === 'string' && (file.startsWith('http://') || file.startsWith('https://'))) {
    return file;
  }
  
  const uploadDir = path.join(__dirname, '../uploads/contactpage', folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname);
  const filename = `${folder}-${timestamp}-${random}${ext}`;
  const destPath = path.join(uploadDir, filename);
  
  fs.copyFileSync(file.path, destPath);
  try { fs.unlinkSync(file.path); } catch(e) {}
  
  return `/uploads/contactpage/${folder}/${filename}`;
};

// Helper: Convert string to boolean
const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value === 'true' || value === '1' || value === 'yes';
  }
  return Boolean(value);
};

// Helper: Add full URLs to response
const addFullUrls = (data, baseUrl) => {
  const result = { ...data };
  
  if (result.hero?.image && !result.hero.image.startsWith('http')) {
    result.hero.image = `${baseUrl}${result.hero.image}`;
  }
  
  return result;
};

// ==================== CONTACT PAGE HERO MANAGEMENT ====================

// @desc    Create contact page hero (Admin)
// @route   POST /api/contact/hero
export const createContactHero = async (req, res) => {
  try {
    let contactPage = await ContactPage.findOne();
    if (!contactPage) contactPage = new ContactPage();
    
    if (contactPage.hero) {
      return res.status(400).json({ 
        success: false, 
        message: 'Contact hero already exists. Use updateContactHero to update.' 
      });
    }
    
    // Validate required fields
    if (!req.body.title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!req.body.tag) {
      return res.status(400).json({ success: false, message: 'Tag is required' });
    }
    if (!req.body.description) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }
    
    // Get image from file upload or body
    let image = null;
    if (req.file) {
      image = await saveFile(req.file, 'hero');
    } else if (req.body.image) {
      image = req.body.image;
    }
    
    // Check if image is provided
    if (!image) {
      return res.status(400).json({ 
        success: false, 
        message: 'Image is required. Please upload an image or provide an image URL.' 
      });
    }
    
    contactPage.hero = {
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description,
      image: image,  // Don't allow empty string
      isActive: req.body.isActive !== undefined ? toBoolean(req.body.isActive) : true
    };
    
    await contactPage.save();

    console.log('✅ Contact hero created:', contactPage.hero);
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ 
      success: true, 
      message: 'Contact hero created', 
      data: addFullUrls(contactPage.toObject(), baseUrl).hero 
    });
  } catch (error) {
    console.error('Create contact hero error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update contact page hero (Admin)
// @route   PUT /api/contact/hero
export const updateContactHero = async (req, res) => {
  try {
    const contactPage = await ContactPage.findOne();
    if (!contactPage || !contactPage.hero) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact hero not found. Use createContactHero first.' 
      });
    }
    
    const image = req.file ? await saveFile(req.file, 'hero') : req.body.image;
    
    if (req.body.title !== undefined) contactPage.hero.title = req.body.title;
    if (req.body.tag !== undefined) contactPage.hero.tag = req.body.tag;
    if (req.body.description !== undefined) contactPage.hero.description = req.body.description;
    if (image) contactPage.hero.image = image;
    if (req.body.isActive !== undefined) contactPage.hero.isActive = toBoolean(req.body.isActive);
    
    await contactPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ 
      success: true, 
      message: 'Contact hero updated', 
      data: addFullUrls(contactPage.toObject(), baseUrl).hero 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get contact page hero (Public)
// @route   GET /api/contact/hero
export const getContactHero = async (req, res) => {
  try {
    const contactPage = await ContactPage.findOne();
    if (!contactPage || !contactPage.hero) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact hero not found' 
      });
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ 
      success: true, 
      data: addFullUrls({ hero: contactPage.hero }, baseUrl).hero 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete contact page hero (Admin)
// @route   DELETE /api/contact/hero
export const deleteContactHero = async (req, res) => {
  try {
    const contactPage = await ContactPage.findOne();
    if (!contactPage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact page not found' 
      });
    }
    contactPage.hero = undefined;
    await contactPage.save();
    res.json({ 
      success: true, 
      message: 'Contact hero deleted' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SUBJECT MANAGEMENT ====================

// @desc    Create new contact subject
// @route   POST /api/contact/subjects
export const createSubject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingSubject = await Subject.findOne({ name });
    if (existingSubject) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject already exists' 
      });
    }

    const subject = await Subject.create({
      name,
      description: description || '',
      isActive: true
    });

    res.status(201).json({ 
      success: true, 
      message: 'Subject created successfully', 
      data: subject 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all subjects (Admin)
// @route   GET /api/contact/subjects
export const getAllSubjects = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const subjects = await Subject.find(query)
      .sort({ name: 1 });

    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active subjects for dropdown (Public)
// @route   GET /api/contact/subjects/active
export const getActiveSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true })
      .select('name description')
      .sort({ name: 1 });

    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single subject by ID
// @route   GET /api/contact/subjects/:id
export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subject not found' 
      });
    }

    res.json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update subject
// @route   PUT /api/contact/subjects/:id
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    console.log('🔍 Updating subject ID:', id);
    console.log('📝 Update data:', { name, description, isActive });

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid fields provided for update' 
      });
    }

    const subject = await Subject.findById(id);
    
    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subject not found' 
      });
    }

    if (name && name !== subject.name) {
      const existingSubject = await Subject.findOne({ 
        name: name, 
        _id: { $ne: id } 
      });
      if (existingSubject) {
        return res.status(400).json({ 
          success: false, 
          message: 'Subject name already exists' 
        });
      }
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    );

    console.log('✅ Updated subject:', updatedSubject);

    res.json({ 
      success: true, 
      message: 'Subject updated successfully', 
      data: updatedSubject 
    });
  } catch (error) {
    console.error('Update subject error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject name already exists' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete subject
// @route   DELETE /api/contact/subjects/:id
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subject not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Subject deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle subject active status
// @route   PATCH /api/contact/subjects/:id/toggle
export const toggleSubjectStatus = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subject not found' 
      });
    }

    subject.isActive = !subject.isActive;
    await subject.save();

    res.json({ 
      success: true, 
      message: `Subject ${subject.isActive ? 'activated' : 'deactivated'} successfully`,
      data: subject 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CONTACT FORM MANAGEMENT ====================

export const submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    const subjectDoc = await Subject.findOne({ 
      _id: subject, 
      isActive: true 
    });
    
    if (!subjectDoc) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or inactive subject selected' 
      });
    }

    const contact = await Contact.create({
      name,
      email,
      phone,
      subject: subjectDoc._id,
      subjectName: subjectDoc.name,
      message,
      status: 'pending'
    });

    await contact.populate('subject', 'name description');

    // Create notification for admin
    await createNotification('contact', contact._id, 'Contact', {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      subjectName: subjectDoc.name,
      message: contact.message
    });

    res.status(201).json({ 
      success: true, 
      message: 'Contact form submitted successfully', 
      data: contact 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Get all contact submissions (Admin only)
// @route   GET /api/contact/all
export const getAllContacts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      subject,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (subject) query.subject = subject;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const contacts = await Contact.find(query)
      .populate('subject', 'name description')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: contacts,
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

// @desc    Get single contact submission by ID
// @route   GET /api/contact/:id
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('subject', 'name description');
    
    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact submission not found' 
      });
    }

    if (contact.status === 'pending') {
      contact.status = 'read';
      await contact.save();
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update contact submission status
// @route   PUT /api/contact/:id/status
export const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['pending', 'read', 'replied', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status value' 
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('subject', 'name description');

    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact submission not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Status updated successfully', 
      data: contact 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete contact submission
// @route   DELETE /api/contact/:id
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact submission not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Contact submission deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get contact statistics (Admin only)
// @route   GET /api/contact/stats
export const getContactStats = async (req, res) => {
  try {
    const total = await Contact.countDocuments();
    const pending = await Contact.countDocuments({ status: 'pending' });
    const read = await Contact.countDocuments({ status: 'read' });
    const replied = await Contact.countDocuments({ status: 'replied' });
    const archived = await Contact.countDocuments({ status: 'archived' });

    const subjectStats = await Contact.aggregate([
      { $lookup: { from: 'subjects', localField: 'subject', foreignField: '_id', as: 'subjectInfo' } },
      { $unwind: '$subjectInfo' },
      { $group: { _id: '$subjectInfo.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recent = await Contact.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const totalSubjects = await Subject.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        total,
        pending,
        read,
        replied,
        archived,
        recent,
        totalSubjects,
        bySubject: subjectStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};