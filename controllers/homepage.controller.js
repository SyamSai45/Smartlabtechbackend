import HomePage from '../models/HomePage.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Save uploaded file
const saveFile = async (file, folder) => {
  if (!file) return null;
  if (typeof file === 'string' && file.startsWith('http')) return file;
  
  const uploadDir = path.join(__dirname, '../uploads/homepage', folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  
  const filename = `${folder}-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
  fs.copyFileSync(file.path, path.join(uploadDir, filename));
  try { fs.unlinkSync(file.path); } catch(e) {}
  
  return `/uploads/homepage/${folder}/${filename}`;
};

// Helper: Add full URLs to response
const addFullUrls = (data, baseUrl) => {
  const result = { ...data };
  
  if (result.hero && Array.isArray(result.hero)) {
    result.hero = result.hero.map(item => ({
      ...item,
      image: item.image && !item.image.startsWith('http') ? `${baseUrl}${item.image}` : item.image
    }));
  }
  if (result.about?.image && !result.about.image.startsWith('http')) result.about.image = `${baseUrl}${result.about.image}`;
  if (result.achievements?.images) {
    result.achievements.images = result.achievements.images.map(img => img && !img.startsWith('http') ? `${baseUrl}${img}` : img);
  }
  if (result.testimonials?.testimonials) {
    result.testimonials.testimonials = result.testimonials.testimonials.map(t => ({
      ...t,
      image: t.image && !t.image.startsWith('http') ? `${baseUrl}${t.image}` : t.image
    }));
  }
  return result;
};

// Helper: Handle array operations (hero, testimonials)
const handleArrayItem = async (req, res, arrayPath, itemName, createItem, updateItem) => {
  try {
    const homePage = await HomePage.findOne();
    const [parent, child] = arrayPath.split('.');
    if (!homePage || (child && !homePage[parent]?.[child]) || (!child && !homePage[parent])) {
      return res.status(404).json({ success: false, message: `${itemName} section not found` });
    }
    
    const targetArray = child ? homePage[parent][child] : homePage[parent];
    
    if (req.method === 'POST') {
      const image = req.file ? await saveFile(req.file, itemName.toLowerCase()) : req.body.image;
      targetArray.push(createItem(req.body, image));
      await homePage.save();
      res.status(201).json({ success: true, message: `${itemName} added`, data: targetArray });
    } else if (req.method === 'PUT') {
      const { index } = req.params;
      if (index < 0 || index >= targetArray.length) {
        return res.status(404).json({ success: false, message: `${itemName} not found` });
      }
      const image = req.file ? await saveFile(req.file, itemName.toLowerCase()) : req.body.image;
      targetArray[index] = updateItem(targetArray[index], req.body, image);
      await homePage.save();
      res.json({ success: true, message: `${itemName} updated`, data: targetArray });
    } else if (req.method === 'DELETE') {
      const { index } = req.params;
      if (index < 0 || index >= targetArray.length) {
        return res.status(404).json({ success: false, message: `${itemName} not found` });
      }
      targetArray.splice(index, 1);
      await homePage.save();
      res.json({ success: true, message: `${itemName} deleted` });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Get section with URLs
const getSection = async (req, res, sectionName) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage || !homePage[sectionName]) {
      return res.status(404).json({ success: false, message: `${sectionName} not found` });
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ [sectionName]: homePage[sectionName] }, baseUrl)[sectionName] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Delete section
const deleteSection = async (req, res, sectionName) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage) return res.status(404).json({ success: false, message: 'Home page not found' });
    homePage[sectionName] = undefined;
    await homePage.save();
    res.json({ success: true, message: `${sectionName} deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET FULL HOME PAGE ====================
export const getHomePage = async (req, res) => {
  try {
    const homePage = await HomePage.findOne({ isActive: true });
    if (!homePage) return res.status(404).json({ success: false, message: 'Home page not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls(homePage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== HERO SECTION ====================
export const addHero = async (req, res) => {
  const createItem = (body, image) => ({
    image: image || '', title: body.title, tag: body.tag || '', isActive: body.isActive === 'true'
  });
  const updateItem = (existing, body, image) => ({
    ...existing.toObject(),
    image: image || existing.image,
    title: body.title || existing.title,
    tag: body.tag !== undefined ? body.tag : existing.tag,
    isActive: body.isActive !== undefined ? body.isActive === 'true' : existing.isActive
  });
  await handleArrayItem(req, res, 'hero', 'Hero', createItem, updateItem);
};

export const getAllHero = async (req, res) => getSection(req, res, 'hero');
export const getHeroById = async (req, res) => getSection(req, res, 'hero');
export const updateHero = async (req, res) => addHero(req, res);
export const deleteHero = async (req, res) => deleteSection(req, res, 'hero');

// ==================== ABOUT SECTION ====================
const saveAbout = async (req, res, isUpdate = false) => {
  try {
    let homePage = await HomePage.findOne();
    if (!homePage) homePage = new HomePage();
    
    const image = req.file ? await saveFile(req.file, 'about') : req.body.image;
    const points = req.body.points ? JSON.parse(req.body.points) : (homePage.about?.points || []);
    
    homePage.about = {
      image: image || '',
      tag: req.body.tag || (isUpdate ? homePage.about?.tag : ''),
      title: req.body.title || (isUpdate ? homePage.about?.title : ''),
      description: req.body.description || (isUpdate ? homePage.about?.description : ''),
      points,
      buttonText: req.body.buttonText || (isUpdate ? homePage.about?.buttonText : 'Read More'),
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : (isUpdate ? homePage.about?.isActive : true)
    };
    
    await homePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const status = isUpdate ? 200 : 201;
    res.status(status).json({ success: true, message: `About ${isUpdate ? 'updated' : 'created'}`, data: addFullUrls(homePage.toObject(), baseUrl).about });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAbout = (req, res) => saveAbout(req, res, false);
export const updateAbout = (req, res) => saveAbout(req, res, true);
export const getAbout = async (req, res) => getSection(req, res, 'about');
export const deleteAbout = async (req, res) => deleteSection(req, res, 'about');

// About Points
const handleAboutPoint = async (req, res, isUpdate = false) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage?.about) return res.status(404).json({ success: false, message: 'About section not found' });
    
    if (req.method === 'POST') {
      homePage.about.points.push({ point: req.body.point });
      await homePage.save();
      res.status(201).json({ success: true, message: 'Point added', data: homePage.about.points });
    } else {
      const { index } = req.params;
      if (index < 0 || index >= homePage.about.points.length) {
        return res.status(404).json({ success: false, message: 'Point not found' });
      }
      if (isUpdate) homePage.about.points[index].point = req.body.point;
      else homePage.about.points.splice(index, 1);
      await homePage.save();
      res.json({ success: true, message: `Point ${isUpdate ? 'updated' : 'deleted'}`, data: homePage.about.points });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addAboutPoint = (req, res) => handleAboutPoint(req, res, false);
export const updateAboutPoint = (req, res) => handleAboutPoint(req, res, true);
export const deleteAboutPoint = (req, res) => handleAboutPoint(req, res, false);

// ==================== ACHIEVEMENTS SECTION ====================
const saveAchievements = async (req, res, isUpdate = false) => {
  try {
    let homePage = await HomePage.findOne();
    if (!homePage) homePage = new HomePage();
    
    let images = homePage.achievements?.images || [];
    if (req.files?.length) {
      for (const file of req.files) {
        const img = await saveFile(file, 'achievements');
        if (img) images.push(img);
      }
    } else if (req.body.images) {
      images = JSON.parse(req.body.images);
    }
    
    homePage.achievements = {
      yearsOfExperience: req.body.yearsOfExperience !== undefined ? parseInt(req.body.yearsOfExperience) : (isUpdate ? homePage.achievements?.yearsOfExperience : 0),
      productsDelivered: req.body.productsDelivered !== undefined ? parseInt(req.body.productsDelivered) : (isUpdate ? homePage.achievements?.productsDelivered : 0),
      clientSatisfaction: req.body.clientSatisfaction || (isUpdate ? homePage.achievements?.clientSatisfaction : ''),
      quote: req.body.quote || (isUpdate ? homePage.achievements?.quote : ''),
      images
    };
    
    await homePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const status = isUpdate ? 200 : 201;
    res.status(status).json({ success: true, message: `Achievements ${isUpdate ? 'updated' : 'created'}`, data: addFullUrls(homePage.toObject(), baseUrl).achievements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAchievements = (req, res) => saveAchievements(req, res, false);
export const updateAchievements = (req, res) => saveAchievements(req, res, true);
export const getAchievements = async (req, res) => getSection(req, res, 'achievements');
export const deleteAchievements = async (req, res) => deleteSection(req, res, 'achievements');

// Achievement Images
const handleAchievementImage = async (req, res, isUpdate = false) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage?.achievements) return res.status(404).json({ success: false, message: 'Achievements section not found' });
    
    if (req.method === 'POST') {
      const image = req.file ? await saveFile(req.file, 'achievements') : req.body.image;
      homePage.achievements.images.push(image);
      await homePage.save();
      res.status(201).json({ success: true, message: 'Image added', data: homePage.achievements.images });
    } else {
      const { index } = req.params;
      if (index < 0 || index >= homePage.achievements.images.length) {
        return res.status(404).json({ success: false, message: 'Image not found' });
      }
      if (isUpdate) {
        const image = req.file ? await saveFile(req.file, 'achievements') : req.body.image;
        homePage.achievements.images[index] = image;
        await homePage.save();
        res.json({ success: true, message: 'Image updated', data: homePage.achievements.images });
      } else {
        homePage.achievements.images.splice(index, 1);
        await homePage.save();
        res.json({ success: true, message: 'Image deleted' });
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addAchievementImage = (req, res) => handleAchievementImage(req, res, false);
export const updateAchievementImage = (req, res) => handleAchievementImage(req, res, true);
export const deleteAchievementImage = (req, res) => handleAchievementImage(req, res, false);

// ==================== TESTIMONIALS SECTION ====================
const saveTestimonials = async (req, res, isUpdate = false) => {
  try {
    let homePage = await HomePage.findOne();
    if (!homePage) homePage = new HomePage();
    
    homePage.testimonials = {
      tag: req.body.tag || (isUpdate ? homePage.testimonials?.tag : ''),
      title: req.body.title || (isUpdate ? homePage.testimonials?.title : ''),
      description: req.body.description || (isUpdate ? homePage.testimonials?.description : ''),
      testimonials: homePage.testimonials?.testimonials || [],
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : (isUpdate ? homePage.testimonials?.isActive : true)
    };
    
    await homePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const status = isUpdate ? 200 : 201;
    res.status(status).json({ success: true, message: `Testimonials section ${isUpdate ? 'updated' : 'created'}`, data: addFullUrls(homePage.toObject(), baseUrl).testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTestimonials = (req, res) => saveTestimonials(req, res, false);
export const updateTestimonials = (req, res) => saveTestimonials(req, res, true);
export const getTestimonials = async (req, res) => getSection(req, res, 'testimonials');
export const deleteTestimonials = async (req, res) => deleteSection(req, res, 'testimonials');

// Testimonial Items
export const addTestimonial = async (req, res) => {
  const createItem = (body, image) => ({
    name: body.name, rating: parseInt(body.rating) || 5, image: image || '',
    role: body.role, review: body.review, isActive: true
  });
  const updateItem = (existing, body, image) => ({
    ...existing.toObject(),
    name: body.name || existing.name,
    rating: body.rating ? parseInt(body.rating) : existing.rating,
    image: image || existing.image,
    role: body.role || existing.role,
    review: body.review || existing.review,
    isActive: body.isActive !== undefined ? body.isActive === 'true' : existing.isActive
  });
  await handleArrayItem(req, res, 'testimonials.testimonials', 'Testimonial', createItem, updateItem);
};

export const updateTestimonial = async (req, res) => addTestimonial(req, res);
export const deleteTestimonial = async (req, res) => addTestimonial(req, res);