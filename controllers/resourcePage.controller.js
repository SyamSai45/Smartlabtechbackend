import ResourcePage from '../models/ResourcePage.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Save uploaded file
const saveFile = async (file, folder) => {
  if (!file) return null;
  if (typeof file === 'string' && file.startsWith('http')) return file;
  
  const uploadDir = path.join(__dirname, '../uploads/resources', folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  
  const filename = `${folder}-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
  fs.copyFileSync(file.path, path.join(uploadDir, filename));
  try { fs.unlinkSync(file.path); } catch(e) {}
  
  return `/uploads/resources/${folder}/${filename}`;
};

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true' || value === '1' || value === 'yes';
  return Boolean(value);
};

const parseIfString = (value) => {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch(e) { return value; }
  }
  return value;
};

// Helper: Add full URLs to response
const addFullUrls = (data, baseUrl) => {
  const result = { ...data };
  
  const processItems = (items, fields = ['image', 'file']) => {
    if (!items) return;
    items.forEach(item => {
      fields.forEach(field => {
        if (item[field] && !item[field].startsWith('http')) item[field] = `${baseUrl}${item[field]}`;
      });
    });
  };
  
  if (result.hero?.image && !result.hero.image.startsWith('http')) result.hero.image = `${baseUrl}${result.hero.image}`;
  if (result.articles?.articles) processItems(result.articles.articles);
  if (result.caseStudies?.caseStudies) processItems(result.caseStudies.caseStudies);
  if (result.pdfs?.pdfs) processItems(result.pdfs.pdfs, ['file']);
  
  return result;
};

// Helper: Get or create resource page
const getOrCreatePage = async () => {
  let page = await ResourcePage.findOne();
  if (!page) page = new ResourcePage();
  return page;
};

// Helper: Update array item by index
const updateArrayItem = (array, index, updates) => {
  if (index < 0 || index >= array.length) throw new Error('Item not found');
  Object.assign(array[index], updates);
  return array[index];
};

// ==================== FULL PAGE CRUD ====================

export const getResourcePage = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne({ isActive: true });
    if (!resourcePage) return res.status(404).json({ success: false, message: 'Resource page not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls(resourcePage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createResourcePage = async (req, res) => {
  try {
    if (await ResourcePage.findOne()) {
      return res.status(400).json({ success: false, message: 'Resource page already exists. Use PUT to update.' });
    }
    const resourcePage = await ResourcePage.create(req.body);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Resource page created', data: addFullUrls(resourcePage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateResourcePage = async (req, res) => {
  try {
    const resourcePage = await getOrCreatePage();
    const { hero, articles, pdfs, caseStudies, faqs, achievements, cta, isActive } = req.body;
    if (hero) resourcePage.hero = hero;
    if (articles) resourcePage.articles = articles;
    if (pdfs) resourcePage.pdfs = pdfs;
    if (caseStudies) resourcePage.caseStudies = caseStudies;
    if (faqs) resourcePage.faqs = faqs;
    if (achievements) resourcePage.achievements = achievements;
    if (cta) resourcePage.cta = cta;
    if (isActive !== undefined) resourcePage.isActive = toBoolean(isActive);
    
    await resourcePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Resource page updated', data: addFullUrls(resourcePage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteResourcePage = async (req, res) => {
  try {
    await ResourcePage.deleteMany({});
    res.json({ success: true, message: 'Resource page deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GENERIC SECTION HANDLERS ====================
const handleSectionGet = async (req, res, sectionName) => {
  try {
    const page = await ResourcePage.findOne();
    if (!page?.[sectionName]) return res.status(404).json({ success: false, message: `${sectionName} section not found` });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ [sectionName]: page[sectionName] }, baseUrl)[sectionName] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const handleSectionUpdate = async (req, res, sectionName, defaultConfig = {}) => {
  try {
    const page = await getOrCreatePage();
    const items = req.body[sectionName] ? parseIfString(req.body[sectionName]) : [];
    page[sectionName] = {
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description || '',
      [sectionName === 'faqs' ? 'faqs' : sectionName === 'achievements' ? 'achievements' : sectionName]: items,
      isActive: toBoolean(req.body.isActive)
    };
    await page.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: `${sectionName} section updated`, data: addFullUrls(page.toObject(), baseUrl)[sectionName] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const handleAddItem = async (req, res, sectionName, itemConfig, fileField = null) => {
  try {
    const page = await ResourcePage.findOne();
    if (!page) return res.status(404).json({ success: false, message: 'Resource page not found' });
    if (!page[sectionName]) page[sectionName] = { title: '', tag: '', [sectionName === 'faqs' ? 'faqs' : sectionName === 'achievements' ? 'achievements' : sectionName]: [] };
    
    const item = { ...itemConfig };
    if (fileField && req.file) item[fileField] = await saveFile(req.file, sectionName);
    if (fileField && req.body[fileField]) item[fileField] = req.body[fileField];
    
    const arrayName = sectionName === 'faqs' ? 'faqs' : sectionName === 'achievements' ? 'achievements' : sectionName;
    page[sectionName][arrayName].push(item);
    await page.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const itemsWithUrls = page[sectionName][arrayName].map(i => {
      if (fileField && i[fileField] && !i[fileField].startsWith('http')) i[fileField] = `${baseUrl}${i[fileField]}`;
      return i;
    });
    res.status(201).json({ success: true, message: `${sectionName.slice(0, -1)} added`, data: itemsWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const handleUpdateItem = async (req, res, sectionName, fields, fileField = null) => {
  try {
    const page = await ResourcePage.findOne();
    const arrayName = sectionName === 'faqs' ? 'faqs' : sectionName === 'achievements' ? 'achievements' : sectionName;
    const items = page?.[sectionName]?.[arrayName];
    const index = parseInt(req.params.index);
    
    if (!page?.[sectionName]?.[arrayName] || isNaN(index) || index < 0 || index >= items.length) {
      return res.status(404).json({ success: false, message: `${sectionName.slice(0, -1)} not found` });
    }
    
    const updates = {};
    fields.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
    if (fileField && req.file) updates[fileField] = await saveFile(req.file, sectionName);
    if (req.body.isActive !== undefined) updates.isActive = toBoolean(req.body.isActive);
    
    const updated = updateArrayItem(items, index, updates);
    await page.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const result = updated.toObject();
    if (fileField && result[fileField] && !result[fileField].startsWith('http')) result[fileField] = `${baseUrl}${result[fileField]}`;
    res.json({ success: true, message: `${sectionName.slice(0, -1)} updated`, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const handleDeleteItem = async (req, res, sectionName) => {
  try {
    const page = await ResourcePage.findOne();
    const arrayName = sectionName === 'faqs' ? 'faqs' : sectionName === 'achievements' ? 'achievements' : sectionName;
    const items = page?.[sectionName]?.[arrayName];
    const index = parseInt(req.params.index);
    
    if (!page?.[sectionName]?.[arrayName] || isNaN(index) || index < 0 || index >= items.length) {
      return res.status(404).json({ success: false, message: `${sectionName.slice(0, -1)} not found` });
    }
    
    items.splice(index, 1);
    await page.save();
    res.json({ success: true, message: `${sectionName.slice(0, -1)} deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== HERO SECTION ====================
export const createHero = async (req, res) => {
  try {
    const page = await getOrCreatePage();
    if (page.hero) return res.status(400).json({ success: false, message: 'Hero already exists. Use updateHero.' });
    
    const image = req.file ? await saveFile(req.file, 'hero') : req.body.image;
    page.hero = { title: req.body.title, tag: req.body.tag, description: req.body.description, image: image || '', isActive: toBoolean(req.body.isActive) };
    await page.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Hero created', data: addFullUrls(page.toObject(), baseUrl).hero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHero = async (req, res) => {
  try {
    const page = await ResourcePage.findOne();
    if (!page?.hero) return res.status(404).json({ success: false, message: 'Hero not found' });
    
    const image = req.file ? await saveFile(req.file, 'hero') : req.body.image;
    if (req.body.title !== undefined) page.hero.title = req.body.title;
    if (req.body.tag !== undefined) page.hero.tag = req.body.tag;
    if (req.body.description !== undefined) page.hero.description = req.body.description;
    if (image) page.hero.image = image;
    if (req.body.isActive !== undefined) page.hero.isActive = toBoolean(req.body.isActive);
    
    await page.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Hero updated', data: addFullUrls(page.toObject(), baseUrl).hero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHero = async (req, res) => handleSectionGet(req, res, 'hero');
export const deleteHero = async (req, res) => {
  try {
    const page = await ResourcePage.findOne();
    if (!page) return res.status(404).json({ success: false, message: 'Resource page not found' });
    page.hero = undefined;
    await page.save();
    res.json({ success: true, message: 'Hero deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ARTICLES SECTION ====================
export const updateArticlesSection = async (req, res) => handleSectionUpdate(req, res, 'articles');
export const getArticlesSection = async (req, res) => handleSectionGet(req, res, 'articles');
export const addArticle = async (req, res) => handleAddItem(req, res, 'articles', { title: req.body.title, tag: req.body.tag, description: req.body.description, duration: req.body.duration || '5 min read', link: req.body.link || '', isActive: true }, 'image');
export const updateArticle = async (req, res) => handleUpdateItem(req, res, 'articles', ['title', 'tag', 'description', 'duration', 'link'], 'image');
export const deleteArticle = async (req, res) => handleDeleteItem(req, res, 'articles');

// ==================== PDFs SECTION ====================
export const updatePdfsSection = async (req, res) => handleSectionUpdate(req, res, 'pdfs');
export const getPdfsSection = async (req, res) => handleSectionGet(req, res, 'pdfs');
export const addPdf = async (req, res) => handleAddItem(req, res, 'pdfs', { name: req.body.name, size: req.body.size || '', isActive: true }, 'file');
export const deletePdf = async (req, res) => handleDeleteItem(req, res, 'pdfs');

// ==================== CASE STUDIES SECTION ====================
export const updateCaseStudiesSection = async (req, res) => handleSectionUpdate(req, res, 'caseStudies');
export const getCaseStudiesSection = async (req, res) => handleSectionGet(req, res, 'caseStudies');
export const addCaseStudy = async (req, res) => handleAddItem(req, res, 'caseStudies', { title: req.body.title, tag: req.body.tag, description: req.body.description, link: req.body.link || '', isActive: true }, 'image');
export const updateCaseStudy = async (req, res) => handleUpdateItem(req, res, 'caseStudies', ['title', 'tag', 'description', 'link'], 'image');
export const deleteCaseStudy = async (req, res) => handleDeleteItem(req, res, 'caseStudies');

// ==================== FAQS SECTION ====================
export const updateFaqsSection = async (req, res) => handleSectionUpdate(req, res, 'faqs');
export const getFaqsSection = async (req, res) => handleSectionGet(req, res, 'faqs');
export const addFaq = async (req, res) => handleAddItem(req, res, 'faqs', { question: req.body.question, answer: req.body.answer, isActive: true });
export const updateFaq = async (req, res) => handleUpdateItem(req, res, 'faqs', ['question', 'answer']);
export const deleteFaq = async (req, res) => handleDeleteItem(req, res, 'faqs');

// ==================== ACHIEVEMENTS SECTION ====================
export const updateAchievementsSection = async (req, res) => handleSectionUpdate(req, res, 'achievements');
export const getAchievementsSection = async (req, res) => handleSectionGet(req, res, 'achievements');
export const addAchievement = async (req, res) => handleAddItem(req, res, 'achievements', { title: req.body.title, isActive: true });
export const updateAchievement = async (req, res) => handleUpdateItem(req, res, 'achievements', ['title']);
export const deleteAchievement = async (req, res) => handleDeleteItem(req, res, 'achievements');

// ==================== CTA SECTION ====================
export const updateCtaSection = async (req, res) => {
  try {
    const page = await getOrCreatePage();
    page.cta = { title: req.body.title, description: req.body.description, buttonText: req.body.buttonText || 'Learn More', isActive: toBoolean(req.body.isActive) };
    await page.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'CTA section updated', data: addFullUrls(page.toObject(), baseUrl).cta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCtaSection = async (req, res) => handleSectionGet(req, res, 'cta');
export const deleteCtaSection = async (req, res) => {
  try {
    const page = await ResourcePage.findOne();
    if (!page) return res.status(404).json({ success: false, message: 'Resource page not found' });
    page.cta = undefined;
    await page.save();
    res.json({ success: true, message: 'CTA section deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};