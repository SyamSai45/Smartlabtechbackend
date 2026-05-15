import SupportPage from '../models/SupportPage.js';
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
  
  const uploadDir = path.join(__dirname, '../uploads/supportpage', folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname);
  const filename = `${folder}-${timestamp}-${random}${ext}`;
  const destPath = path.join(uploadDir, filename);
  
  fs.copyFileSync(file.path, destPath);
  try { fs.unlinkSync(file.path); } catch(e) {}
  
  return `/uploads/supportpage/${folder}/${filename}`;
};

// Helper: Convert string to boolean
const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value === 'true' || value === '1' || value === 'yes';
  }
  return Boolean(value);
};

// Helper: Parse JSON if string
const parseIfString = (value) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }
  return value;
};

// Helper: Add full URLs to response
const addFullUrls = (data, baseUrl) => {
  const result = { ...data };
  
  if (result.supportHero?.image && !result.supportHero.image.startsWith('http')) {
    result.supportHero.image = `${baseUrl}${result.supportHero.image}`;
  }
  
  return result;
};

// ==================== FULL PAGE CRUD ====================

// Get Support Page (Public)
export const getSupportPage = async (req, res) => {
  try {
    let supportPage = await SupportPage.findOne({ isActive: true });
    if (!supportPage) {
      return res.status(404).json({ success: false, message: 'Support page not found' });
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls(supportPage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create Support Page (Admin)
export const createSupportPage = async (req, res) => {
  try {
    const existingPage = await SupportPage.findOne();
    if (existingPage) {
      return res.status(400).json({ success: false, message: 'Support page already exists. Use PUT to update.' });
    }
    
    const supportPage = await SupportPage.create(req.body);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Support page created', data: addFullUrls(supportPage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Support Page (Admin)
export const updateSupportPage = async (req, res) => {
  try {
    let supportPage = await SupportPage.findOne();
    if (!supportPage) {
      return res.status(404).json({ success: false, message: 'Support page not found' });
    }
    
    const { supportHero, supportCards, supportSolutions, supportLifeCycle, supportFaq, supportCta, isActive } = req.body;
    if (supportHero) supportPage.supportHero = supportHero;
    if (supportCards) supportPage.supportCards = supportCards;
    if (supportSolutions) supportPage.supportSolutions = supportSolutions;
    if (supportLifeCycle) supportPage.supportLifeCycle = supportLifeCycle;
    if (supportFaq) supportPage.supportFaq = supportFaq;
    if (supportCta) supportPage.supportCta = supportCta;
    if (isActive !== undefined) supportPage.isActive = toBoolean(isActive);
    
    await supportPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Support page updated', data: addFullUrls(supportPage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Support Page (Admin)
export const deleteSupportPage = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage) {
      return res.status(404).json({ success: false, message: 'Support page not found' });
    }
    await SupportPage.deleteMany({});
    res.json({ success: true, message: 'Support page deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SUPPORT HERO SECTION CRUD ====================

export const createSupportHero = async (req, res) => {
  try {
    let supportPage = await SupportPage.findOne();
    if (!supportPage) supportPage = new SupportPage();
    
    if (supportPage.supportHero) {
      return res.status(400).json({ success: false, message: 'Support hero already exists. Use updateSupportHero to update.' });
    }
    
    const image = req.file ? await saveFile(req.file, 'hero') : req.body.image;
    supportPage.supportHero = {
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description,
      image: image || '',
      mobileNumber: req.body.mobileNumber,
      email: req.body.email,
      isActive: toBoolean(req.body.isActive)
    };
    await supportPage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Support hero created', data: addFullUrls(supportPage.toObject(), baseUrl).supportHero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupportHero = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportHero) {
      return res.status(404).json({ success: false, message: 'Support hero not found. Use createSupportHero first.' });
    }
    
    const image = req.file ? await saveFile(req.file, 'hero') : req.body.image;
    
    if (req.body.title !== undefined) supportPage.supportHero.title = req.body.title;
    if (req.body.tag !== undefined) supportPage.supportHero.tag = req.body.tag;
    if (req.body.description !== undefined) supportPage.supportHero.description = req.body.description;
    if (image) supportPage.supportHero.image = image;
    if (req.body.mobileNumber !== undefined) supportPage.supportHero.mobileNumber = req.body.mobileNumber;
    if (req.body.email !== undefined) supportPage.supportHero.email = req.body.email;
    if (req.body.isActive !== undefined) supportPage.supportHero.isActive = toBoolean(req.body.isActive);
    
    await supportPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Support hero updated', data: addFullUrls(supportPage.toObject(), baseUrl).supportHero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSupportHero = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportHero) return res.status(404).json({ success: false, message: 'Support hero not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ supportHero: supportPage.supportHero }, baseUrl).supportHero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSupportHero = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage) return res.status(404).json({ success: false, message: 'Support page not found' });
    supportPage.supportHero = undefined;
    await supportPage.save();
    res.json({ success: true, message: 'Support hero deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SUPPORT CARDS CRUD (Array) ====================

export const addSupportCard = async (req, res) => {
  try {
    let supportPage = await SupportPage.findOne();
    if (!supportPage) supportPage = new SupportPage();
    if (!supportPage.supportCards) supportPage.supportCards = [];
    
    supportPage.supportCards.push({
      title: req.body.title,
      description: req.body.description,
      icon: req.body.icon || '',
      isActive: toBoolean(req.body.isActive !== undefined ? req.body.isActive : true)
    });
    await supportPage.save();
    
    res.status(201).json({ success: true, message: 'Card added', data: supportPage.supportCards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllSupportCards = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportCards || supportPage.supportCards.length === 0) {
      return res.status(404).json({ success: false, message: 'No cards found' });
    }
    res.json({ success: true, data: supportPage.supportCards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSupportCardById = async (req, res) => {
  try {
    const { index } = req.params;
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportCards || index < 0 || index >= supportPage.supportCards.length) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }
    res.json({ success: true, data: supportPage.supportCards[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupportCard = async (req, res) => {
  try {
    const { index } = req.params;
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportCards || index < 0 || index >= supportPage.supportCards.length) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }
    
    if (req.body.title !== undefined) supportPage.supportCards[index].title = req.body.title;
    if (req.body.description !== undefined) supportPage.supportCards[index].description = req.body.description;
    if (req.body.icon !== undefined) supportPage.supportCards[index].icon = req.body.icon;
    if (req.body.isActive !== undefined) supportPage.supportCards[index].isActive = toBoolean(req.body.isActive);
    
    await supportPage.save();
    res.json({ success: true, message: 'Card updated', data: supportPage.supportCards[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSupportCard = async (req, res) => {
  try {
    const { index } = req.params;
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportCards || index < 0 || index >= supportPage.supportCards.length) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }
    
    supportPage.supportCards.splice(index, 1);
    await supportPage.save();
    res.json({ success: true, message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SUPPORT SOLUTIONS SECTION CRUD ====================

export const createSupportSolutions = async (req, res) => {
  try {
    let supportPage = await SupportPage.findOne();
    if (!supportPage) supportPage = new SupportPage();
    
    if (supportPage.supportSolutions) {
      return res.status(400).json({ success: false, message: 'Support solutions already exists. Use updateSupportSolutions to update.' });
    }
    
    const cards = req.body.cards ? parseIfString(req.body.cards) : [];
    supportPage.supportSolutions = {
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description || '',
      cards: cards,
      isActive: toBoolean(req.body.isActive)
    };
    await supportPage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Support solutions created', data: addFullUrls(supportPage.toObject(), baseUrl).supportSolutions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupportSolutions = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportSolutions) {
      return res.status(404).json({ success: false, message: 'Support solutions not found. Use createSupportSolutions first.' });
    }
    
    if (req.body.title !== undefined) supportPage.supportSolutions.title = req.body.title;
    if (req.body.tag !== undefined) supportPage.supportSolutions.tag = req.body.tag;
    if (req.body.description !== undefined) supportPage.supportSolutions.description = req.body.description;
    if (req.body.cards !== undefined) supportPage.supportSolutions.cards = parseIfString(req.body.cards);
    if (req.body.isActive !== undefined) supportPage.supportSolutions.isActive = toBoolean(req.body.isActive);
    
    await supportPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Support solutions updated', data: addFullUrls(supportPage.toObject(), baseUrl).supportSolutions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSupportSolutions = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportSolutions) return res.status(404).json({ success: false, message: 'Support solutions not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ supportSolutions: supportPage.supportSolutions }, baseUrl).supportSolutions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addSolutionCard = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportSolutions) {
      return res.status(404).json({ success: false, message: 'Support solutions not found' });
    }
    
    supportPage.supportSolutions.cards.push({
      title: req.body.title,
      description: req.body.description,
      icon: req.body.icon || '',
      isActive: toBoolean(req.body.isActive !== undefined ? req.body.isActive : true)
    });
    await supportPage.save();
    res.status(201).json({ success: true, message: 'Solution card added', data: supportPage.supportSolutions.cards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSolutionCard = async (req, res) => {
  try {
    const { index } = req.params;
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportSolutions || !supportPage.supportSolutions.cards || index < 0 || index >= supportPage.supportSolutions.cards.length) {
      return res.status(404).json({ success: false, message: 'Solution card not found' });
    }
    
    if (req.body.title !== undefined) supportPage.supportSolutions.cards[index].title = req.body.title;
    if (req.body.description !== undefined) supportPage.supportSolutions.cards[index].description = req.body.description;
    if (req.body.icon !== undefined) supportPage.supportSolutions.cards[index].icon = req.body.icon;
    if (req.body.isActive !== undefined) supportPage.supportSolutions.cards[index].isActive = toBoolean(req.body.isActive);
    
    await supportPage.save();
    res.json({ success: true, message: 'Solution card updated', data: supportPage.supportSolutions.cards[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSolutionCard = async (req, res) => {
  try {
    const { index } = req.params;
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportSolutions || !supportPage.supportSolutions.cards || index < 0 || index >= supportPage.supportSolutions.cards.length) {
      return res.status(404).json({ success: false, message: 'Solution card not found' });
    }
    
    supportPage.supportSolutions.cards.splice(index, 1);
    await supportPage.save();
    res.json({ success: true, message: 'Solution card deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSupportSolutions = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage) return res.status(404).json({ success: false, message: 'Support page not found' });
    supportPage.supportSolutions = undefined;
    await supportPage.save();
    res.json({ success: true, message: 'Support solutions deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SUPPORT LIFE CYCLE SECTION CRUD ====================

export const createSupportLifeCycle = async (req, res) => {
  try {
    let supportPage = await SupportPage.findOne();
    if (!supportPage) supportPage = new SupportPage();
    
    if (supportPage.supportLifeCycle) {
      return res.status(400).json({ success: false, message: 'Support life cycle already exists. Use updateSupportLifeCycle to update.' });
    }
    
    const points = req.body.points ? parseIfString(req.body.points) : [];
    supportPage.supportLifeCycle = {
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description,
      points: points,
      metaTitle: req.body.metaTitle || '',
      metaDescription: req.body.metaDescription || '',
      isActive: toBoolean(req.body.isActive)
    };
    await supportPage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Support life cycle created', data: addFullUrls(supportPage.toObject(), baseUrl).supportLifeCycle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupportLifeCycle = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportLifeCycle) {
      return res.status(404).json({ success: false, message: 'Support life cycle not found. Use createSupportLifeCycle first.' });
    }
    
    if (req.body.title !== undefined) supportPage.supportLifeCycle.title = req.body.title;
    if (req.body.tag !== undefined) supportPage.supportLifeCycle.tag = req.body.tag;
    if (req.body.description !== undefined) supportPage.supportLifeCycle.description = req.body.description;
    if (req.body.points !== undefined) supportPage.supportLifeCycle.points = parseIfString(req.body.points);
    if (req.body.metaTitle !== undefined) supportPage.supportLifeCycle.metaTitle = req.body.metaTitle;
    if (req.body.metaDescription !== undefined) supportPage.supportLifeCycle.metaDescription = req.body.metaDescription;
    if (req.body.isActive !== undefined) supportPage.supportLifeCycle.isActive = toBoolean(req.body.isActive);
    
    await supportPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Support life cycle updated', data: addFullUrls(supportPage.toObject(), baseUrl).supportLifeCycle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSupportLifeCycle = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportLifeCycle) return res.status(404).json({ success: false, message: 'Support life cycle not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ supportLifeCycle: supportPage.supportLifeCycle }, baseUrl).supportLifeCycle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addLifeCyclePoint = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportLifeCycle) {
      return res.status(404).json({ success: false, message: 'Support life cycle not found' });
    }
    
    supportPage.supportLifeCycle.points.push({
      point: req.body.point,
      isActive: toBoolean(req.body.isActive !== undefined ? req.body.isActive : true)
    });
    await supportPage.save();
    res.status(201).json({ success: true, message: 'Point added', data: supportPage.supportLifeCycle.points });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLifeCyclePoint = async (req, res) => {
  try {
    const { index } = req.params;
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportLifeCycle || !supportPage.supportLifeCycle.points || index < 0 || index >= supportPage.supportLifeCycle.points.length) {
      return res.status(404).json({ success: false, message: 'Point not found' });
    }
    
    if (req.body.point !== undefined) supportPage.supportLifeCycle.points[index].point = req.body.point;
    if (req.body.isActive !== undefined) supportPage.supportLifeCycle.points[index].isActive = toBoolean(req.body.isActive);
    
    await supportPage.save();
    res.json({ success: true, message: 'Point updated', data: supportPage.supportLifeCycle.points[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteLifeCyclePoint = async (req, res) => {
  try {
    const { index } = req.params;
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportLifeCycle || !supportPage.supportLifeCycle.points || index < 0 || index >= supportPage.supportLifeCycle.points.length) {
      return res.status(404).json({ success: false, message: 'Point not found' });
    }
    
    supportPage.supportLifeCycle.points.splice(index, 1);
    await supportPage.save();
    res.json({ success: true, message: 'Point deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSupportLifeCycle = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage) return res.status(404).json({ success: false, message: 'Support page not found' });
    supportPage.supportLifeCycle = undefined;
    await supportPage.save();
    res.json({ success: true, message: 'Support life cycle deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SUPPORT FAQ SECTION CRUD ====================

export const createSupportFaq = async (req, res) => {
  try {
    let supportPage = await SupportPage.findOne();
    if (!supportPage) supportPage = new SupportPage();
    
    if (supportPage.supportFaq) {
      return res.status(400).json({ success: false, message: 'Support FAQ already exists. Use updateSupportFaq to update.' });
    }
    
    const faqs = req.body.faqs ? parseIfString(req.body.faqs) : [];
    supportPage.supportFaq = {
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description || '',
      faqs: faqs,
      isActive: toBoolean(req.body.isActive)
    };
    await supportPage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Support FAQ created', data: addFullUrls(supportPage.toObject(), baseUrl).supportFaq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupportFaq = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportFaq) {
      return res.status(404).json({ success: false, message: 'Support FAQ not found. Use createSupportFaq first.' });
    }
    
    if (req.body.title !== undefined) supportPage.supportFaq.title = req.body.title;
    if (req.body.tag !== undefined) supportPage.supportFaq.tag = req.body.tag;
    if (req.body.description !== undefined) supportPage.supportFaq.description = req.body.description;
    if (req.body.faqs !== undefined) supportPage.supportFaq.faqs = parseIfString(req.body.faqs);
    if (req.body.isActive !== undefined) supportPage.supportFaq.isActive = toBoolean(req.body.isActive);
    
    await supportPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Support FAQ updated', data: addFullUrls(supportPage.toObject(), baseUrl).supportFaq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSupportFaq = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportFaq) return res.status(404).json({ success: false, message: 'Support FAQ not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ supportFaq: supportPage.supportFaq }, baseUrl).supportFaq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addFaq = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportFaq) {
      return res.status(404).json({ success: false, message: 'Support FAQ not found' });
    }
    
    supportPage.supportFaq.faqs.push({
      question: req.body.question,
      answer: req.body.answer,
      isActive: toBoolean(req.body.isActive !== undefined ? req.body.isActive : true)
    });
    await supportPage.save();
    res.status(201).json({ success: true, message: 'FAQ added', data: supportPage.supportFaq.faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFaq = async (req, res) => {
  try {
    const { index } = req.params;
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportFaq || !supportPage.supportFaq.faqs || index < 0 || index >= supportPage.supportFaq.faqs.length) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    if (req.body.question !== undefined) supportPage.supportFaq.faqs[index].question = req.body.question;
    if (req.body.answer !== undefined) supportPage.supportFaq.faqs[index].answer = req.body.answer;
    if (req.body.isActive !== undefined) supportPage.supportFaq.faqs[index].isActive = toBoolean(req.body.isActive);
    
    await supportPage.save();
    res.json({ success: true, message: 'FAQ updated', data: supportPage.supportFaq.faqs[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFaq = async (req, res) => {
  try {
    const { index } = req.params;
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportFaq || !supportPage.supportFaq.faqs || index < 0 || index >= supportPage.supportFaq.faqs.length) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    supportPage.supportFaq.faqs.splice(index, 1);
    await supportPage.save();
    res.json({ success: true, message: 'FAQ deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSupportFaq = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage) return res.status(404).json({ success: false, message: 'Support page not found' });
    supportPage.supportFaq = undefined;
    await supportPage.save();
    res.json({ success: true, message: 'Support FAQ deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SUPPORT CTA SECTION CRUD ====================

export const createSupportCta = async (req, res) => {
  try {
    let supportPage = await SupportPage.findOne();
    if (!supportPage) supportPage = new SupportPage();
    
    if (supportPage.supportCta) {
      return res.status(400).json({ success: false, message: 'Support CTA already exists. Use updateSupportCta to update.' });
    }
    
    supportPage.supportCta = {
      title: req.body.title,
      tag: req.body.tag || '',
      description: req.body.description,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      isActive: toBoolean(req.body.isActive)
    };
    await supportPage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Support CTA created', data: addFullUrls(supportPage.toObject(), baseUrl).supportCta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupportCta = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportCta) {
      return res.status(404).json({ success: false, message: 'Support CTA not found. Use createSupportCta first.' });
    }
    
    if (req.body.title !== undefined) supportPage.supportCta.title = req.body.title;
    if (req.body.tag !== undefined) supportPage.supportCta.tag = req.body.tag;
    if (req.body.description !== undefined) supportPage.supportCta.description = req.body.description;
    if (req.body.email !== undefined) supportPage.supportCta.email = req.body.email;
    if (req.body.phoneNumber !== undefined) supportPage.supportCta.phoneNumber = req.body.phoneNumber;
    if (req.body.isActive !== undefined) supportPage.supportCta.isActive = toBoolean(req.body.isActive);
    
    await supportPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Support CTA updated', data: addFullUrls(supportPage.toObject(), baseUrl).supportCta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSupportCta = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage || !supportPage.supportCta) return res.status(404).json({ success: false, message: 'Support CTA not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ supportCta: supportPage.supportCta }, baseUrl).supportCta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSupportCta = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage) return res.status(404).json({ success: false, message: 'Support page not found' });
    supportPage.supportCta = undefined;
    await supportPage.save();
    res.json({ success: true, message: 'Support CTA deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};