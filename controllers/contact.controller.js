import { Subject, Contact, ContactPage } from '../models/Contact.js';
import { createNotification } from './notification.controller.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Save uploaded file
const saveFile = async (file, folder) => {
  if (!file) return null;
  if (typeof file === 'string' && file.startsWith('http')) return file;
  
  const uploadDir = path.join(__dirname, '../uploads/contactpage', folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  
  const filename = `${folder}-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
  fs.copyFileSync(file.path, path.join(uploadDir, filename));
  try { fs.unlinkSync(file.path); } catch(e) {}
  
  return `/uploads/contactpage/${folder}/${filename}`;
};

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true' || value === '1' || value === 'yes';
  return Boolean(value);
};

const addFullUrls = (data, baseUrl) => {
  const result = { ...data };
  if (result.hero?.image && !result.hero.image.startsWith('http')) {
    result.hero.image = `${baseUrl}${result.hero.image}`;
  }
  return result;
};

// ==================== CONTACT PAGE HERO ====================
const handleContactHero = async (req, res, isUpdate = false) => {
  try {
    let contactPage = await ContactPage.findOne();
    if (!contactPage) contactPage = new ContactPage();
    
    if (!isUpdate && contactPage.hero) {
      return res.status(400).json({ success: false, message: 'Contact hero already exists. Use update.' });
    }
    if (isUpdate && (!contactPage || !contactPage.hero)) {
      return res.status(404).json({ success: false, message: 'Contact hero not found' });
    }
    
    if (!isUpdate) {
      const { title, tag, description, isActive } = req.body;
      if (!title || !tag || !description) {
        return res.status(400).json({ success: false, message: 'Title, tag, and description are required' });
      }
      
      const image = req.file ? await saveFile(req.file, 'hero') : req.body.image;
      if (!image) return res.status(400).json({ success: false, message: 'Image is required' });
      
      contactPage.hero = { title, tag, description, image, isActive: toBoolean(isActive) };
    } else {
      const image = req.file ? await saveFile(req.file, 'hero') : req.body.image;
      if (req.body.title !== undefined) contactPage.hero.title = req.body.title;
      if (req.body.tag !== undefined) contactPage.hero.tag = req.body.tag;
      if (req.body.description !== undefined) contactPage.hero.description = req.body.description;
      if (image) contactPage.hero.image = image;
      if (req.body.isActive !== undefined) contactPage.hero.isActive = toBoolean(req.body.isActive);
    }
    
    await contactPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(isUpdate ? 200 : 201).json({ 
      success: true, 
      message: `Contact hero ${isUpdate ? 'updated' : 'created'}`, 
      data: addFullUrls(contactPage.toObject(), baseUrl).hero 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createContactHero = (req, res) => handleContactHero(req, res, false);
export const updateContactHero = (req, res) => handleContactHero(req, res, true);

export const getContactHero = async (req, res) => {
  try {
    const contactPage = await ContactPage.findOne();
    if (!contactPage?.hero) return res.status(404).json({ success: false, message: 'Contact hero not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ hero: contactPage.hero }, baseUrl).hero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteContactHero = async (req, res) => {
  try {
    const contactPage = await ContactPage.findOne();
    if (!contactPage) return res.status(404).json({ success: false, message: 'Contact page not found' });
    contactPage.hero = undefined;
    await contactPage.save();
    res.json({ success: true, message: 'Contact hero deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SUBJECT MANAGEMENT ====================
export const createSubject = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (await Subject.findOne({ name })) {
      return res.status(400).json({ success: false, message: 'Subject already exists' });
    }
    const subject = await Subject.create({ name, description: description || '', isActive: true });
    res.status(201).json({ success: true, message: 'Subject created successfully', data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllSubjects = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = isActive !== undefined ? { isActive: isActive === 'true' } : {};
    const subjects = await Subject.find(query).sort({ name: 1 });
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true }).select('name description').sort({ name: 1 });
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided' });
    }
    
    const subject = await Subject.findById(id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    
    if (name && name !== subject.name && await Subject.findOne({ name, _id: { $ne: id } })) {
      return res.status(400).json({ success: false, message: 'Subject name already exists' });
    }
    
    const updatedSubject = await Subject.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    res.json({ success: true, message: 'Subject updated successfully', data: updatedSubject });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Subject name already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleSubjectStatus = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    subject.isActive = !subject.isActive;
    await subject.save();
    res.json({ success: true, message: `Subject ${subject.isActive ? 'activated' : 'deactivated'}`, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CONTACT FORM ====================
export const submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    const subjectDoc = await Subject.findOne({ _id: subject, isActive: true });
    if (!subjectDoc) return res.status(400).json({ success: false, message: 'Invalid or inactive subject' });
    
    const contact = await Contact.create({ name, email, phone, subject: subjectDoc._id, subjectName: subjectDoc.name, message, status: 'pending' });
    await contact.populate('subject', 'name description');
    
    await createNotification('contact', contact._id, 'Contact', { name, email, phone, subjectName: subjectDoc.name, message });
    res.status(201).json({ success: true, message: 'Contact form submitted successfully', data: contact });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(error.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, subject, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = {};
    if (status) query.status = status;
    if (subject) query.subject = subject;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } }
    ];
    
    const contacts = await Contact.find(query)
      .populate('subject', 'name description')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    
    const total = await Contact.countDocuments(query);
    res.json({ success: true, data: contacts, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).populate('subject', 'name description');
    if (!contact) return res.status(404).json({ success: false, message: 'Contact submission not found' });
    if (contact.status === 'pending') {
      contact.status = 'read';
      await contact.save();
    }
    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'read', 'replied', 'archived'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status value' });
    
    const contact = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('subject', 'name description');
    if (!contact) return res.status(404).json({ success: false, message: 'Contact submission not found' });
    res.json({ success: true, message: 'Status updated successfully', data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Contact submission not found' });
    res.json({ success: true, message: 'Contact submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getContactStats = async (req, res) => {
  try {
    const stats = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'pending' }),
      Contact.countDocuments({ status: 'read' }),
      Contact.countDocuments({ status: 'replied' }),
      Contact.countDocuments({ status: 'archived' }),
      Subject.countDocuments({ isActive: true })
    ]);
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await Contact.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    
    const subjectStats = await Contact.aggregate([
      { $lookup: { from: 'subjects', localField: 'subject', foreignField: '_id', as: 'subjectInfo' } },
      { $unwind: '$subjectInfo' },
      { $group: { _id: '$subjectInfo.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({ success: true, data: { total: stats[0], pending: stats[1], read: stats[2], replied: stats[3], archived: stats[4], recent, totalSubjects: stats[5], bySubject: subjectStats } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};