import ResourcePage from '../models/ResourcePage.js';
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
  
  const uploadDir = path.join(__dirname, '../uploads/resources', folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname);
  const filename = `${folder}-${timestamp}-${random}${ext}`;
  const destPath = path.join(uploadDir, filename);
  
  fs.copyFileSync(file.path, destPath);
  try { fs.unlinkSync(file.path); } catch(e) {}
  
  return `/uploads/resources/${folder}/${filename}`;
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
  
  if (result.hero?.image && !result.hero.image.startsWith('http')) {
    result.hero.image = `${baseUrl}${result.hero.image}`;
  }
  if (result.articles?.articles) {
    result.articles.articles = result.articles.articles.map(article => ({
      ...article,
      image: article.image && !article.image.startsWith('http') ? `${baseUrl}${article.image}` : article.image
    }));
  }
  if (result.caseStudies?.caseStudies) {
    result.caseStudies.caseStudies = result.caseStudies.caseStudies.map(cs => ({
      ...cs,
      image: cs.image && !cs.image.startsWith('http') ? `${baseUrl}${cs.image}` : cs.image
    }));
  }
  if (result.pdfs?.pdfs) {
    result.pdfs.pdfs = result.pdfs.pdfs.map(pdf => ({
      ...pdf,
      file: pdf.file && !pdf.file.startsWith('http') ? `${baseUrl}${pdf.file}` : pdf.file
    }));
  }
  
  return result;
};

// ==================== FULL PAGE CRUD ====================

// @desc    Get resource page (Public)
// @route   GET /api/resources
export const getResourcePage = async (req, res) => {
  try {
    let resourcePage = await ResourcePage.findOne({ isActive: true });
    if (!resourcePage) {
      return res.status(404).json({ success: false, message: 'Resource page not found' });
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls(resourcePage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create resource page (Admin)
// @route   POST /api/resources
export const createResourcePage = async (req, res) => {
  try {
    const existingPage = await ResourcePage.findOne();
    if (existingPage) {
      return res.status(400).json({ success: false, message: 'Resource page already exists. Use PUT to update.' });
    }
    
    const resourcePage = await ResourcePage.create(req.body);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Resource page created', data: addFullUrls(resourcePage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update resource page (Admin)
// @route   PUT /api/resources
export const updateResourcePage = async (req, res) => {
  try {
    let resourcePage = await ResourcePage.findOne();
    if (!resourcePage) {
      return res.status(404).json({ success: false, message: 'Resource page not found' });
    }
    
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

// @desc    Delete resource page (Admin)
// @route   DELETE /api/resources
export const deleteResourcePage = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage) {
      return res.status(404).json({ success: false, message: 'Resource page not found' });
    }
    await ResourcePage.deleteMany({});
    res.json({ success: true, message: 'Resource page deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== HERO SECTION CRUD ====================

export const createHero = async (req, res) => {
  try {
    let resourcePage = await ResourcePage.findOne();
    if (!resourcePage) resourcePage = new ResourcePage();
    
    if (resourcePage.hero) {
      return res.status(400).json({ success: false, message: 'Hero already exists. Use updateHero to update.' });
    }
    
    const image = req.file ? await saveFile(req.file, 'hero') : req.body.image;
    resourcePage.hero = {
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description,
      image: image || '',
      isActive: toBoolean(req.body.isActive)
    };
    await resourcePage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Hero created', data: addFullUrls(resourcePage.toObject(), baseUrl).hero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHero = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.hero) {
      return res.status(404).json({ success: false, message: 'Hero not found' });
    }
    
    const image = req.file ? await saveFile(req.file, 'hero') : req.body.image;
    if (req.body.title !== undefined) resourcePage.hero.title = req.body.title;
    if (req.body.tag !== undefined) resourcePage.hero.tag = req.body.tag;
    if (req.body.description !== undefined) resourcePage.hero.description = req.body.description;
    if (image) resourcePage.hero.image = image;
    if (req.body.isActive !== undefined) resourcePage.hero.isActive = toBoolean(req.body.isActive);
    
    await resourcePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Hero updated', data: addFullUrls(resourcePage.toObject(), baseUrl).hero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHero = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.hero) return res.status(404).json({ success: false, message: 'Hero not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ hero: resourcePage.hero }, baseUrl).hero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteHero = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage) return res.status(404).json({ success: false, message: 'Resource page not found' });
    resourcePage.hero = undefined;
    await resourcePage.save();
    res.json({ success: true, message: 'Hero deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ARTICLES SECTION CRUD ====================

export const updateArticlesSection = async (req, res) => {
  try {
    let resourcePage = await ResourcePage.findOne();
    if (!resourcePage) resourcePage = new ResourcePage();
    
    const articles = req.body.articles ? parseIfString(req.body.articles) : [];
    resourcePage.articles = {
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description || '',
      articles: articles,
      isActive: toBoolean(req.body.isActive)
    };
    await resourcePage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Articles section updated', data: addFullUrls(resourcePage.toObject(), baseUrl).articles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getArticlesSection = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.articles) return res.status(404).json({ success: false, message: 'Articles section not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ articles: resourcePage.articles }, baseUrl).articles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addArticle = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage) return res.status(404).json({ success: false, message: 'Resource page not found' });
    if (!resourcePage.articles) resourcePage.articles = { title: '', tag: '', articles: [] };
    
    const image = req.file ? await saveFile(req.file, 'articles') : req.body.image;
    resourcePage.articles.articles.push({
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description,
      image: image || '',
      duration: req.body.duration || '5 min read',
      link: req.body.link || '',
      isActive: true
    });
    await resourcePage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const articlesWithUrls = resourcePage.articles.articles.map(article => ({
      ...article.toObject(),
      image: article.image && !article.image.startsWith('http') ? `${baseUrl}${article.image}` : article.image
    }));
    res.status(201).json({ success: true, message: 'Article added', data: articlesWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateArticle = async (req, res) => {
  try {
    const { index } = req.params;
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.articles || !resourcePage.articles.articles || index < 0 || index >= resourcePage.articles.articles.length) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    
    const image = req.file ? await saveFile(req.file, 'articles') : req.body.image;
    if (req.body.title !== undefined) resourcePage.articles.articles[index].title = req.body.title;
    if (req.body.tag !== undefined) resourcePage.articles.articles[index].tag = req.body.tag;
    if (req.body.description !== undefined) resourcePage.articles.articles[index].description = req.body.description;
    if (image) resourcePage.articles.articles[index].image = image;
    if (req.body.duration !== undefined) resourcePage.articles.articles[index].duration = req.body.duration;
    if (req.body.link !== undefined) resourcePage.articles.articles[index].link = req.body.link;
    if (req.body.isActive !== undefined) resourcePage.articles.articles[index].isActive = toBoolean(req.body.isActive);
    
    await resourcePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const articleWithUrl = {
      ...resourcePage.articles.articles[index].toObject(),
      image: resourcePage.articles.articles[index].image && !resourcePage.articles.articles[index].image.startsWith('http') ? `${baseUrl}${resourcePage.articles.articles[index].image}` : resourcePage.articles.articles[index].image
    };
    res.json({ success: true, message: 'Article updated', data: articleWithUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteArticle = async (req, res) => {
  try {
    const { index } = req.params;
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.articles || !resourcePage.articles.articles || index < 0 || index >= resourcePage.articles.articles.length) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    resourcePage.articles.articles.splice(index, 1);
    await resourcePage.save();
    res.json({ success: true, message: 'Article deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== PDF SECTION CRUD ====================

export const updatePdfsSection = async (req, res) => {
  try {
    let resourcePage = await ResourcePage.findOne();
    if (!resourcePage) resourcePage = new ResourcePage();
    
    const pdfs = req.body.pdfs ? parseIfString(req.body.pdfs) : [];
    resourcePage.pdfs = {
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description || '',
      pdfs: pdfs,
      isActive: toBoolean(req.body.isActive)
    };
    await resourcePage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'PDFs section updated', data: addFullUrls(resourcePage.toObject(), baseUrl).pdfs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPdfsSection = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.pdfs) return res.status(404).json({ success: false, message: 'PDFs section not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ pdfs: resourcePage.pdfs }, baseUrl).pdfs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addPdf = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage) return res.status(404).json({ success: false, message: 'Resource page not found' });
    if (!resourcePage.pdfs) resourcePage.pdfs = { title: '', tag: '', pdfs: [] };
    
    const file = req.file ? await saveFile(req.file, 'pdfs') : req.body.file;
    resourcePage.pdfs.pdfs.push({
      name: req.body.name,
      file: file || '',
      size: req.body.size || '',
      isActive: true
    });
    await resourcePage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const pdfsWithUrls = resourcePage.pdfs.pdfs.map(pdf => ({
      ...pdf.toObject(),
      file: pdf.file && !pdf.file.startsWith('http') ? `${baseUrl}${pdf.file}` : pdf.file
    }));
    res.status(201).json({ success: true, message: 'PDF added', data: pdfsWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePdf = async (req, res) => {
  try {
    const { index } = req.params;
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.pdfs || !resourcePage.pdfs.pdfs || index < 0 || index >= resourcePage.pdfs.pdfs.length) {
      return res.status(404).json({ success: false, message: 'PDF not found' });
    }
    resourcePage.pdfs.pdfs.splice(index, 1);
    await resourcePage.save();
    res.json({ success: true, message: 'PDF deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CASE STUDIES SECTION CRUD ====================

export const updateCaseStudiesSection = async (req, res) => {
  try {
    let resourcePage = await ResourcePage.findOne();
    if (!resourcePage) resourcePage = new ResourcePage();
    
    const caseStudies = req.body.caseStudies ? parseIfString(req.body.caseStudies) : [];
    resourcePage.caseStudies = {
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description || '',
      caseStudies: caseStudies,
      isActive: toBoolean(req.body.isActive)
    };
    await resourcePage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Case studies section updated', data: addFullUrls(resourcePage.toObject(), baseUrl).caseStudies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCaseStudiesSection = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.caseStudies) return res.status(404).json({ success: false, message: 'Case studies section not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ caseStudies: resourcePage.caseStudies }, baseUrl).caseStudies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addCaseStudy = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage) return res.status(404).json({ success: false, message: 'Resource page not found' });
    if (!resourcePage.caseStudies) resourcePage.caseStudies = { title: '', tag: '', caseStudies: [] };
    
    const image = req.file ? await saveFile(req.file, 'casestudies') : req.body.image;
    resourcePage.caseStudies.caseStudies.push({
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description,
      image: image || '',
      link: req.body.link || '',
      isActive: true
    });
    await resourcePage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const caseStudiesWithUrls = resourcePage.caseStudies.caseStudies.map(cs => ({
      ...cs.toObject(),
      image: cs.image && !cs.image.startsWith('http') ? `${baseUrl}${cs.image}` : cs.image
    }));
    res.status(201).json({ success: true, message: 'Case study added', data: caseStudiesWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCaseStudy = async (req, res) => {
  try {
    const { index } = req.params;
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.caseStudies || !resourcePage.caseStudies.caseStudies || index < 0 || index >= resourcePage.caseStudies.caseStudies.length) {
      return res.status(404).json({ success: false, message: 'Case study not found' });
    }
    
    const image = req.file ? await saveFile(req.file, 'casestudies') : req.body.image;
    if (req.body.title !== undefined) resourcePage.caseStudies.caseStudies[index].title = req.body.title;
    if (req.body.tag !== undefined) resourcePage.caseStudies.caseStudies[index].tag = req.body.tag;
    if (req.body.description !== undefined) resourcePage.caseStudies.caseStudies[index].description = req.body.description;
    if (image) resourcePage.caseStudies.caseStudies[index].image = image;
    if (req.body.link !== undefined) resourcePage.caseStudies.caseStudies[index].link = req.body.link;
    if (req.body.isActive !== undefined) resourcePage.caseStudies.caseStudies[index].isActive = toBoolean(req.body.isActive);
    
    await resourcePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const csWithUrl = {
      ...resourcePage.caseStudies.caseStudies[index].toObject(),
      image: resourcePage.caseStudies.caseStudies[index].image && !resourcePage.caseStudies.caseStudies[index].image.startsWith('http') ? `${baseUrl}${resourcePage.caseStudies.caseStudies[index].image}` : resourcePage.caseStudies.caseStudies[index].image
    };
    res.json({ success: true, message: 'Case study updated', data: csWithUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCaseStudy = async (req, res) => {
  try {
    const { index } = req.params;
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.caseStudies || !resourcePage.caseStudies.caseStudies || index < 0 || index >= resourcePage.caseStudies.caseStudies.length) {
      return res.status(404).json({ success: false, message: 'Case study not found' });
    }
    resourcePage.caseStudies.caseStudies.splice(index, 1);
    await resourcePage.save();
    res.json({ success: true, message: 'Case study deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== FAQ SECTION CRUD ====================

export const updateFaqsSection = async (req, res) => {
  try {
    let resourcePage = await ResourcePage.findOne();
    if (!resourcePage) resourcePage = new ResourcePage();
    
    const faqs = req.body.faqs ? parseIfString(req.body.faqs) : [];
    resourcePage.faqs = {
      tag: req.body.tag,
      title: req.body.title,
      description: req.body.description || '',
      faqs: faqs,
      isActive: toBoolean(req.body.isActive)
    };
    await resourcePage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'FAQs section updated', data: addFullUrls(resourcePage.toObject(), baseUrl).faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFaqsSection = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.faqs) return res.status(404).json({ success: false, message: 'FAQs section not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ faqs: resourcePage.faqs }, baseUrl).faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addFaq = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage) return res.status(404).json({ success: false, message: 'Resource page not found' });
    if (!resourcePage.faqs) resourcePage.faqs = { tag: '', title: '', faqs: [] };
    
    resourcePage.faqs.faqs.push({
      question: req.body.question,
      answer: req.body.answer,
      isActive: true
    });
    await resourcePage.save();
    res.status(201).json({ success: true, message: 'FAQ added', data: resourcePage.faqs.faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFaq = async (req, res) => {
  try {
    const { index } = req.params;
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.faqs || !resourcePage.faqs.faqs || index < 0 || index >= resourcePage.faqs.faqs.length) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    if (req.body.question !== undefined) resourcePage.faqs.faqs[index].question = req.body.question;
    if (req.body.answer !== undefined) resourcePage.faqs.faqs[index].answer = req.body.answer;
    if (req.body.isActive !== undefined) resourcePage.faqs.faqs[index].isActive = toBoolean(req.body.isActive);
    
    await resourcePage.save();
    res.json({ success: true, message: 'FAQ updated', data: resourcePage.faqs.faqs[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFaq = async (req, res) => {
  try {
    const { index } = req.params;
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.faqs || !resourcePage.faqs.faqs || index < 0 || index >= resourcePage.faqs.faqs.length) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    resourcePage.faqs.faqs.splice(index, 1);
    await resourcePage.save();
    res.json({ success: true, message: 'FAQ deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ACHIEVEMENTS SECTION CRUD ====================

export const updateAchievementsSection = async (req, res) => {
  try {
    let resourcePage = await ResourcePage.findOne();
    if (!resourcePage) resourcePage = new ResourcePage();
    
    const achievements = req.body.achievements ? parseIfString(req.body.achievements) : [];
    resourcePage.achievements = {
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description || '',
      achievements: achievements,
      isActive: toBoolean(req.body.isActive)
    };
    await resourcePage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Achievements section updated', data: addFullUrls(resourcePage.toObject(), baseUrl).achievements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAchievementsSection = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.achievements) return res.status(404).json({ success: false, message: 'Achievements section not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ achievements: resourcePage.achievements }, baseUrl).achievements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addAchievement = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage) return res.status(404).json({ success: false, message: 'Resource page not found' });
    if (!resourcePage.achievements) resourcePage.achievements = { title: '', tag: '', achievements: [] };
    
    resourcePage.achievements.achievements.push({
      title: req.body.title,
      isActive: true
    });
    await resourcePage.save();
    res.status(201).json({ success: true, message: 'Achievement added', data: resourcePage.achievements.achievements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAchievement = async (req, res) => {
  try {
    const { index } = req.params;
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.achievements || !resourcePage.achievements.achievements || index < 0 || index >= resourcePage.achievements.achievements.length) {
      return res.status(404).json({ success: false, message: 'Achievement not found' });
    }
    
    if (req.body.title !== undefined) resourcePage.achievements.achievements[index].title = req.body.title;
    if (req.body.isActive !== undefined) resourcePage.achievements.achievements[index].isActive = toBoolean(req.body.isActive);
    
    await resourcePage.save();
    res.json({ success: true, message: 'Achievement updated', data: resourcePage.achievements.achievements[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAchievement = async (req, res) => {
  try {
    const { index } = req.params;
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.achievements || !resourcePage.achievements.achievements || index < 0 || index >= resourcePage.achievements.achievements.length) {
      return res.status(404).json({ success: false, message: 'Achievement not found' });
    }
    resourcePage.achievements.achievements.splice(index, 1);
    await resourcePage.save();
    res.json({ success: true, message: 'Achievement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CTA SECTION CRUD ====================

export const updateCtaSection = async (req, res) => {
  try {
    let resourcePage = await ResourcePage.findOne();
    if (!resourcePage) resourcePage = new ResourcePage();
    
    resourcePage.cta = {
      title: req.body.title,
      description: req.body.description,
      buttonText: req.body.buttonText || 'Learn More',
      isActive: toBoolean(req.body.isActive)
    };
    await resourcePage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'CTA section updated', data: addFullUrls(resourcePage.toObject(), baseUrl).cta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCtaSection = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage || !resourcePage.cta) return res.status(404).json({ success: false, message: 'CTA section not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ cta: resourcePage.cta }, baseUrl).cta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCtaSection = async (req, res) => {
  try {
    const resourcePage = await ResourcePage.findOne();
    if (!resourcePage) return res.status(404).json({ success: false, message: 'Resource page not found' });
    resourcePage.cta = undefined;
    await resourcePage.save();
    res.json({ success: true, message: 'CTA section deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};