import AboutPage from '../models/AboutPage.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Save uploaded file
const saveFile = async (file, folder) => {
  if (!file) return null;
  if (typeof file === 'string' && (file.startsWith('http://') || file.startsWith('https://'))) return file;
  
  const uploadDir = path.join(__dirname, '../uploads/aboutpage', folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname);
  const filename = `${folder}-${timestamp}-${random}${ext}`;
  const destPath = path.join(uploadDir, filename);
  
  fs.copyFileSync(file.path, destPath);
  try { fs.unlinkSync(file.path); } catch(e) {}
  
  return `/uploads/aboutpage/${folder}/${filename}`;
};

// Helper: Add full URLs
const addFullUrls = (data, baseUrl) => {
  const result = { ...data };
  if (result.hero?.image && !result.hero.image.startsWith('http')) result.hero.image = `${baseUrl}${result.hero.image}`;
  if (result.about?.bgImage && !result.about.bgImage.startsWith('http')) result.about.bgImage = `${baseUrl}${result.about.bgImage}`;
  if (result.whyChooseUs?.image && !result.whyChooseUs.image.startsWith('http')) result.whyChooseUs.image = `${baseUrl}${result.whyChooseUs.image}`;
  if (result.cards) result.cards = result.cards.map(card => ({ ...card, image: card.image?.startsWith('http') ? card.image : `${baseUrl}${card.image}` }));
  if (result.coreValues?.values) result.coreValues.values = result.coreValues.values.map(val => ({ ...val, icon: val.icon?.startsWith('http') ? val.icon : `${baseUrl}${val.icon}` }));
  return result;
};

// ==================== FULL PAGE ====================
export const getAboutPage = async (req, res) => {
  try {
    const aboutPage = await AboutPage.findOne({ isActive: true });
    if (!aboutPage) return res.status(404).json({ success: false, message: 'About page not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls(aboutPage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAboutPage = async (req, res) => {
  try {
    const existingPage = await AboutPage.findOne();
    if (existingPage) return res.status(400).json({ success: false, message: 'About page already exists' });
    const aboutPage = await AboutPage.create(req.body);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'About page created', data: addFullUrls(aboutPage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAboutPage = async (req, res) => {
  try {
    const aboutPage = await AboutPage.findOne();
    if (!aboutPage) return res.status(404).json({ success: false, message: 'About page not found' });
    Object.assign(aboutPage, req.body);
    await aboutPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'About page updated', data: addFullUrls(aboutPage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAboutPage = async (req, res) => {
  try {
    await AboutPage.deleteMany({});
    res.json({ success: true, message: 'About page deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== HERO ====================
export const createHero = async (req, res) => {
  try {
    let aboutPage = await AboutPage.findOne();
    if (!aboutPage) aboutPage = new AboutPage();
    if (aboutPage.hero) return res.status(400).json({ success: false, message: 'Hero already exists' });
    
    const image = req.file ? await saveFile(req.file, 'hero') : req.body.image;
    aboutPage.hero = { title: req.body.title, tag: req.body.tag || '', description: req.body.description, image: image || '', isActive: req.body.isActive === 'true' };
    await aboutPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Hero created', data: addFullUrls(aboutPage.toObject(), baseUrl).hero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHero = async (req, res) => {
  try {
    const aboutPage = await AboutPage.findOne();
    if (!aboutPage?.hero) return res.status(404).json({ success: false, message: 'Hero not found' });
    
    const image = req.file ? await saveFile(req.file, 'hero') : req.body.image;
    if (req.body.title) aboutPage.hero.title = req.body.title;
    if (req.body.tag !== undefined) aboutPage.hero.tag = req.body.tag;
    if (req.body.description) aboutPage.hero.description = req.body.description;
    if (image) aboutPage.hero.image = image;
    if (req.body.isActive !== undefined) aboutPage.hero.isActive = req.body.isActive === 'true';
    await aboutPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Hero updated', data: addFullUrls(aboutPage.toObject(), baseUrl).hero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHero = async (req, res) => {
  try {
    const aboutPage = await AboutPage.findOne();
    if (!aboutPage?.hero) return res.status(404).json({ success: false, message: 'Hero not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ hero: aboutPage.hero }, baseUrl).hero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteHero = async (req, res) => {
  try {
    const aboutPage = await AboutPage.findOne();
    if (!aboutPage) return res.status(404).json({ success: false, message: 'About page not found' });
    aboutPage.hero = undefined;
    await aboutPage.save();
    res.json({ success: true, message: 'Hero deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ABOUT SECTION ====================
export const createAbout = async (req, res) => {
  try {
    let aboutPage = await AboutPage.findOne();
    if (!aboutPage) aboutPage = new AboutPage();
    if (aboutPage.about) return res.status(400).json({ success: false, message: 'About section already exists' });
    
    const bgImage = req.file ? await saveFile(req.file, 'about') : req.body.bgImage;
    aboutPage.about = { title: req.body.title, tag: req.body.tag, description: req.body.description, bgImage: bgImage || '', isActive: req.body.isActive === 'true' };
    await aboutPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'About section created', data: addFullUrls(aboutPage.toObject(), baseUrl).about });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAbout = async (req, res) => {
  try {
    const aboutPage = await AboutPage.findOne();
    if (!aboutPage?.about) return res.status(404).json({ success: false, message: 'About section not found' });
    
    const bgImage = req.file ? await saveFile(req.file, 'about') : req.body.bgImage;
    if (req.body.title) aboutPage.about.title = req.body.title;
    if (req.body.tag) aboutPage.about.tag = req.body.tag;
    if (req.body.description) aboutPage.about.description = req.body.description;
    if (bgImage) aboutPage.about.bgImage = bgImage;
    if (req.body.isActive !== undefined) aboutPage.about.isActive = req.body.isActive === 'true';
    await aboutPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'About section updated', data: addFullUrls(aboutPage.toObject(), baseUrl).about });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAbout = async (req, res) => {
  try {
    const aboutPage = await AboutPage.findOne();
    if (!aboutPage?.about) return res.status(404).json({ success: false, message: 'About section not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ about: aboutPage.about }, baseUrl).about });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAbout = async (req, res) => {
  try {
    const aboutPage = await AboutPage.findOne();
    if (!aboutPage) return res.status(404).json({ success: false, message: 'About page not found' });
    aboutPage.about = undefined;
    await aboutPage.save();
    res.json({ success: true, message: 'About section deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CARDS ====================
export const addCard = async (req, res) => {
  try {
    let aboutPage = await AboutPage.findOne();
    if (!aboutPage) aboutPage = new AboutPage();
    if (!aboutPage.cards) aboutPage.cards = [];
    
    const image = req.file ? await saveFile(req.file, 'cards') : req.body.image;
    aboutPage.cards.push({ title: req.body.title, tag: req.body.tag, description: req.body.description, image: image || '', isActive: req.body.isActive === 'true' });
    await aboutPage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const cardsWithUrls = aboutPage.cards.map(card => ({ ...card.toObject(), image: card.image && !card.image.startsWith('http') ? `${baseUrl}${card.image}` : card.image }));
    res.status(201).json({ success: true, message: 'Card added', data: cardsWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllCards = async (req, res) => {
  try {
    const aboutPage = await AboutPage.findOne();
    if (!aboutPage?.cards?.length) return res.status(404).json({ success: false, message: 'No cards found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const cardsWithUrls = aboutPage.cards.map(card => ({ ...card.toObject(), image: card.image && !card.image.startsWith('http') ? `${baseUrl}${card.image}` : card.image }));
    res.json({ success: true, data: cardsWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCard = async (req, res) => {
  try {
    const { index } = req.params;
    const aboutPage = await AboutPage.findOne();
    if (!aboutPage?.cards?.[index]) return res.status(404).json({ success: false, message: 'Card not found' });
    aboutPage.cards.splice(index, 1);
    await aboutPage.save();
    res.json({ success: true, message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CORE VALUES ====================
export const addCoreValue = async (req, res) => {
  try {
    const aboutPage = await AboutPage.findOne();
    if (!aboutPage?.coreValues) return res.status(404).json({ success: false, message: 'Core values section not found' });
    if (!aboutPage.coreValues.values) aboutPage.coreValues.values = [];
    
    aboutPage.coreValues.values.push({ title: req.body.title, description: req.body.description, icon: req.body.icon || '', isActive: true });
    await aboutPage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const valuesWithUrls = aboutPage.coreValues.values.map(val => ({ ...val, icon: val.icon && !val.icon.startsWith('http') ? `${baseUrl}${val.icon}` : val.icon }));
    res.status(201).json({ success: true, message: 'Core value added', data: valuesWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCoreValue = async (req, res) => {
  try {
    const { index } = req.params;
    const aboutPage = await AboutPage.findOne();
    if (!aboutPage?.coreValues?.values?.[index]) return res.status(404).json({ success: false, message: 'Core value not found' });
    aboutPage.coreValues.values.splice(index, 1);
    await aboutPage.save();
    res.json({ success: true, message: 'Core value deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== WHY CHOOSE US ====================
export const addWhyChoosePoint = async (req, res) => {
  try {
    const aboutPage = await AboutPage.findOne();
    if (!aboutPage?.whyChooseUs) return res.status(404).json({ success: false, message: 'Why choose us section not found' });
    aboutPage.whyChooseUs.points.push({ point: req.body.point, isActive: true });
    await aboutPage.save();
    res.status(201).json({ success: true, message: 'Point added', data: aboutPage.whyChooseUs.points });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteWhyChoosePoint = async (req, res) => {
  try {
    const { index } = req.params;
    const aboutPage = await AboutPage.findOne();
    if (!aboutPage?.whyChooseUs?.points?.[index]) return res.status(404).json({ success: false, message: 'Point not found' });
    aboutPage.whyChooseUs.points.splice(index, 1);
    await aboutPage.save();
    res.json({ success: true, message: 'Point deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CTA ====================
export const createCta = async (req, res) => {
  try {
    let aboutPage = await AboutPage.findOne();
    if (!aboutPage) aboutPage = new AboutPage();
    if (aboutPage.cta) return res.status(400).json({ success: false, message: 'CTA already exists' });
    
    aboutPage.cta = { title: req.body.title, tag: req.body.tag || '', description: req.body.description, isActive: req.body.isActive === 'true' };
    await aboutPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'CTA created', data: addFullUrls(aboutPage.toObject(), baseUrl).cta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCta = async (req, res) => {
  try {
    const aboutPage = await AboutPage.findOne();
    if (!aboutPage?.cta) return res.status(404).json({ success: false, message: 'CTA not found' });
    
    if (req.body.title) aboutPage.cta.title = req.body.title;
    if (req.body.tag !== undefined) aboutPage.cta.tag = req.body.tag;
    if (req.body.description) aboutPage.cta.description = req.body.description;
    if (req.body.isActive !== undefined) aboutPage.cta.isActive = req.body.isActive;
    await aboutPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'CTA updated', data: addFullUrls(aboutPage.toObject(), baseUrl).cta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCta = async (req, res) => {
  try {
    const aboutPage = await AboutPage.findOne();
    if (!aboutPage?.cta) return res.status(404).json({ success: false, message: 'CTA not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ cta: aboutPage.cta }, baseUrl).cta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCta = async (req, res) => {
  try {
    const aboutPage = await AboutPage.findOne();
    if (!aboutPage) return res.status(404).json({ success: false, message: 'About page not found' });
    aboutPage.cta = undefined;
    await aboutPage.save();
    res.json({ success: true, message: 'CTA deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};