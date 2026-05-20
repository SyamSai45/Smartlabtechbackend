import SupportPage from '../models/SupportPage.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Save uploaded file
const saveFile = async (file, folder) => {
  if (!file) return null;
  if (typeof file === 'string' && file.startsWith('http')) return file;
  
  const uploadDir = path.join(__dirname, '../uploads/supportpage', folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  
  const filename = `${folder}-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
  fs.copyFileSync(file.path, path.join(uploadDir, filename));
  try { fs.unlinkSync(file.path); } catch(e) {}
  
  return `/uploads/supportpage/${folder}/${filename}`;
};

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true' || value === '1' || value === 'yes';
  return Boolean(value);
};

const parseJSON = (value) => {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch(e) { return value; }
  }
  return value;
};

// Helper: Add full URLs
const addFullUrls = (data, baseUrl) => {
  const result = { ...data };
  if (result.supportHero?.image && !result.supportHero.image.startsWith('http')) {
    result.supportHero.image = `${baseUrl}${result.supportHero.image}`;
  }
  return result;
};

// Helper: Get or create page
const getOrCreatePage = async () => {
  let page = await SupportPage.findOne();
  if (!page) page = new SupportPage();
  return page;
};

// Helper: Generic section handlers
const handleSectionGet = async (req, res, sectionName, hasImage = false) => {
  try {
    const page = await SupportPage.findOne();
    if (!page?.[sectionName]) return res.status(404).json({ success: false, message: `${sectionName} not found` });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const data = hasImage ? addFullUrls({ [sectionName]: page[sectionName] }, baseUrl)[sectionName] : page[sectionName];
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const handleSectionCreate = async (req, res, sectionName, config = {}) => {
  try {
    const page = await getOrCreatePage();
    if (page[sectionName]) {
      return res.status(400).json({ success: false, message: `${sectionName} already exists. Use update.` });
    }
    
    const image = config.hasImage && req.file ? await saveFile(req.file, config.folder || sectionName) : null;
    const cards = config.hasCards ? parseJSON(req.body.cards) : [];
    const points = config.hasPoints ? parseJSON(req.body.points) : [];
    const faqs = config.hasFaqs ? parseJSON(req.body.faqs) : [];
    
    page[sectionName] = {
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description || '',
      ...(config.hasImage && { image: image || req.body.image || '' }),
      ...(config.hasCards && { cards }),
      ...(config.hasPoints && { points }),
      ...(config.hasFaqs && { faqs }),
      ...(config.hasContact && { mobileNumber: req.body.mobileNumber, email: req.body.email }),
      ...(config.hasMeta && { metaTitle: req.body.metaTitle || '', metaDescription: req.body.metaDescription || '' }),
      ...(config.hasCta && { phoneNumber: req.body.phoneNumber, email: req.body.email }),
      isActive: toBoolean(req.body.isActive)
    };
    await page.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: `${sectionName} created`, data: addFullUrls(page.toObject(), baseUrl)[sectionName] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const handleSectionUpdate = async (req, res, sectionName, config = {}) => {
  try {
    const page = await SupportPage.findOne();
    if (!page?.[sectionName]) {
      return res.status(404).json({ success: false, message: `${sectionName} not found. Use create first.` });
    }
    
    const image = config.hasImage && req.file ? await saveFile(req.file, config.folder || sectionName) : null;
    
    if (req.body.title !== undefined) page[sectionName].title = req.body.title;
    if (req.body.tag !== undefined) page[sectionName].tag = req.body.tag;
    if (req.body.description !== undefined) page[sectionName].description = req.body.description;
    if (image) page[sectionName].image = image;
    if (config.hasCards && req.body.cards !== undefined) page[sectionName].cards = parseJSON(req.body.cards);
    if (config.hasPoints && req.body.points !== undefined) page[sectionName].points = parseJSON(req.body.points);
    if (config.hasFaqs && req.body.faqs !== undefined) page[sectionName].faqs = parseJSON(req.body.faqs);
    if (config.hasContact) {
      if (req.body.mobileNumber !== undefined) page[sectionName].mobileNumber = req.body.mobileNumber;
      if (req.body.email !== undefined) page[sectionName].email = req.body.email;
    }
    if (config.hasMeta) {
      if (req.body.metaTitle !== undefined) page[sectionName].metaTitle = req.body.metaTitle;
      if (req.body.metaDescription !== undefined) page[sectionName].metaDescription = req.body.metaDescription;
    }
    if (config.hasCta) {
      if (req.body.phoneNumber !== undefined) page[sectionName].phoneNumber = req.body.phoneNumber;
      if (req.body.email !== undefined) page[sectionName].email = req.body.email;
    }
    if (req.body.isActive !== undefined) page[sectionName].isActive = toBoolean(req.body.isActive);
    
    await page.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: `${sectionName} updated`, data: addFullUrls(page.toObject(), baseUrl)[sectionName] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const handleSectionDelete = async (req, res, sectionName) => {
  try {
    const page = await SupportPage.findOne();
    if (!page) return res.status(404).json({ success: false, message: 'Support page not found' });
    page[sectionName] = undefined;
    await page.save();
    res.json({ success: true, message: `${sectionName} deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Generic array item handlers
const handleAddItem = async (req, res, sectionName, arrayName, itemFields) => {
  try {
    const page = await SupportPage.findOne();
    if (!page?.[sectionName]) return res.status(404).json({ success: false, message: `${sectionName} not found` });
    
    const newItem = { isActive: true };
    itemFields.forEach(field => { if (req.body[field] !== undefined) newItem[field] = req.body[field]; });
    page[sectionName][arrayName].push(newItem);
    await page.save();
    res.status(201).json({ success: true, message: 'Item added', data: page[sectionName][arrayName] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const handleUpdateItem = async (req, res, sectionName, arrayName, itemFields) => {
  try {
    const page = await SupportPage.findOne();
    const items = page?.[sectionName]?.[arrayName];
    const index = parseInt(req.params.index);
    
    if (!items || isNaN(index) || index < 0 || index >= items.length) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    itemFields.forEach(field => { if (req.body[field] !== undefined) items[index][field] = req.body[field]; });
    if (req.body.isActive !== undefined) items[index].isActive = toBoolean(req.body.isActive);
    
    await page.save();
    res.json({ success: true, message: 'Item updated', data: items[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const handleDeleteItem = async (req, res, sectionName, arrayName) => {
  try {
    const page = await SupportPage.findOne();
    const items = page?.[sectionName]?.[arrayName];
    const index = parseInt(req.params.index);
    
    if (!items || isNaN(index) || index < 0 || index >= items.length) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    items.splice(index, 1);
    await page.save();
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== FULL PAGE CRUD ====================
export const getSupportPage = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne({ isActive: true });
    if (!supportPage) return res.status(404).json({ success: false, message: 'Support page not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls(supportPage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSupportPage = async (req, res) => {
  try {
    if (await SupportPage.findOne()) {
      return res.status(400).json({ success: false, message: 'Support page already exists. Use PUT to update.' });
    }
    const supportPage = await SupportPage.create(req.body);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Support page created', data: addFullUrls(supportPage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupportPage = async (req, res) => {
  try {
    const supportPage = await SupportPage.findOne();
    if (!supportPage) return res.status(404).json({ success: false, message: 'Support page not found' });
    
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

export const deleteSupportPage = async (req, res) => {
  try {
    await SupportPage.deleteMany({});
    res.json({ success: true, message: 'Support page deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SUPPORT HERO ====================
export const createSupportHero = (req, res) => handleSectionCreate(req, res, 'supportHero', { hasImage: true, hasContact: true, folder: 'hero' });
export const updateSupportHero = (req, res) => handleSectionUpdate(req, res, 'supportHero', { hasImage: true, hasContact: true, folder: 'hero' });
export const getSupportHero = (req, res) => handleSectionGet(req, res, 'supportHero', true);
export const deleteSupportHero = (req, res) => handleSectionDelete(req, res, 'supportHero');

// ==================== SUPPORT CARDS (Array) ====================
export const addSupportCard = (req, res) => handleAddItem(req, res, 'supportCards', 'supportCards', ['title', 'description', 'icon']);
export const getAllSupportCards = async (req, res) => {
  try {
    const page = await SupportPage.findOne();
    const cards = page?.supportCards;
    if (!cards?.length) return res.status(404).json({ success: false, message: 'No cards found' });
    res.json({ success: true, data: cards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getSupportCardById = async (req, res) => {
  try {
    const page = await SupportPage.findOne();
    const cards = page?.supportCards;
    const index = parseInt(req.params.index);
    if (!cards || isNaN(index) || index < 0 || index >= cards.length) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }
    res.json({ success: true, data: cards[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const updateSupportCard = (req, res) => handleUpdateItem(req, res, 'supportCards', 'supportCards', ['title', 'description', 'icon']);
export const deleteSupportCard = (req, res) => handleDeleteItem(req, res, 'supportCards', 'supportCards');

// ==================== SUPPORT SOLUTIONS ====================
export const createSupportSolutions = (req, res) => handleSectionCreate(req, res, 'supportSolutions', { hasCards: true });
export const updateSupportSolutions = (req, res) => handleSectionUpdate(req, res, 'supportSolutions', { hasCards: true });
export const getSupportSolutions = (req, res) => handleSectionGet(req, res, 'supportSolutions');
export const deleteSupportSolutions = (req, res) => handleSectionDelete(req, res, 'supportSolutions');
export const addSolutionCard = (req, res) => handleAddItem(req, res, 'supportSolutions', 'cards', ['title', 'description', 'icon']);
export const updateSolutionCard = (req, res) => handleUpdateItem(req, res, 'supportSolutions', 'cards', ['title', 'description', 'icon']);
export const deleteSolutionCard = (req, res) => handleDeleteItem(req, res, 'supportSolutions', 'cards');

// ==================== SUPPORT LIFE CYCLE ====================
export const createSupportLifeCycle = (req, res) => handleSectionCreate(req, res, 'supportLifeCycle', { hasPoints: true, hasMeta: true });
export const updateSupportLifeCycle = (req, res) => handleSectionUpdate(req, res, 'supportLifeCycle', { hasPoints: true, hasMeta: true });
export const getSupportLifeCycle = (req, res) => handleSectionGet(req, res, 'supportLifeCycle');
export const deleteSupportLifeCycle = (req, res) => handleSectionDelete(req, res, 'supportLifeCycle');
export const addLifeCyclePoint = (req, res) => handleAddItem(req, res, 'supportLifeCycle', 'points', ['point']);
export const updateLifeCyclePoint = (req, res) => handleUpdateItem(req, res, 'supportLifeCycle', 'points', ['point']);
export const deleteLifeCyclePoint = (req, res) => handleDeleteItem(req, res, 'supportLifeCycle', 'points');

// ==================== SUPPORT FAQ ====================
export const createSupportFaq = (req, res) => handleSectionCreate(req, res, 'supportFaq', { hasFaqs: true });
export const updateSupportFaq = (req, res) => handleSectionUpdate(req, res, 'supportFaq', { hasFaqs: true });
export const getSupportFaq = (req, res) => handleSectionGet(req, res, 'supportFaq');
export const deleteSupportFaq = (req, res) => handleSectionDelete(req, res, 'supportFaq');
export const addFaq = (req, res) => handleAddItem(req, res, 'supportFaq', 'faqs', ['question', 'answer']);
export const updateFaq = (req, res) => handleUpdateItem(req, res, 'supportFaq', 'faqs', ['question', 'answer']);
export const deleteFaq = (req, res) => handleDeleteItem(req, res, 'supportFaq', 'faqs');

// ==================== SUPPORT CTA ====================
export const createSupportCta = (req, res) => handleSectionCreate(req, res, 'supportCta', { hasCta: true });
export const updateSupportCta = (req, res) => handleSectionUpdate(req, res, 'supportCta', { hasCta: true });
export const getSupportCta = (req, res) => handleSectionGet(req, res, 'supportCta');
export const deleteSupportCta = (req, res) => handleSectionDelete(req, res, 'supportCta');