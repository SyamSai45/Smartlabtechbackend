import HomePage from '../models/HomePage.js';
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
  
  const uploadDir = path.join(__dirname, '../uploads/homepage', folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname);
  const filename = `${folder}-${timestamp}-${random}${ext}`;
  const destPath = path.join(uploadDir, filename);
  
  fs.copyFileSync(file.path, destPath);
  try { fs.unlinkSync(file.path); } catch(e) {}
  
  return `/uploads/homepage/${folder}/${filename}`;
};

// Helper: Add full URLs to response
const addFullUrls = (data, baseUrl) => {
  const result = { ...data };
  if (result.hero?.image && !result.hero.image.startsWith('http')) result.hero.image = `${baseUrl}${result.hero.image}`;
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

// ==================== HERO SECTION CRUD ====================
export const createHero = async (req, res) => {
  try {
    let homePage = await HomePage.findOne();
    if (!homePage) homePage = new HomePage();
    
    const image = req.file ? await saveFile(req.file, 'hero') : req.body.image;
    homePage.hero = {
      image: image || '',
      title: req.body.title,
      tag: req.body.tag || '',
      isActive: req.body.isActive === 'true'
    };
    
    await homePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Hero created', data: addFullUrls(homePage.toObject(), baseUrl).hero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHero = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage || !homePage.hero) return res.status(404).json({ success: false, message: 'Hero not found' });
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ hero: homePage.hero }, baseUrl).hero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHero = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage) return res.status(404).json({ success: false, message: 'Home page not found' });
    
    const image = req.file ? await saveFile(req.file, 'hero') : req.body.image || homePage.hero?.image;
    homePage.hero = {
      image: image || '',
      title: req.body.title || homePage.hero?.title,
      tag: req.body.tag || homePage.hero?.tag,
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : homePage.hero?.isActive
    };
    
    await homePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Hero updated', data: addFullUrls(homePage.toObject(), baseUrl).hero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteHero = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage) return res.status(404).json({ success: false, message: 'Home page not found' });
    
    homePage.hero = undefined;
    await homePage.save();
    res.json({ success: true, message: 'Hero deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ABOUT SECTION CRUD ====================
export const createAbout = async (req, res) => {
  try {
    let homePage = await HomePage.findOne();
    if (!homePage) homePage = new HomePage();
    
    const image = req.file ? await saveFile(req.file, 'about') : req.body.image;
    const points = req.body.points ? JSON.parse(req.body.points) : [];
    
    homePage.about = {
      image: image || '',
      tag: req.body.tag,
      title: req.body.title,
      description: req.body.description,
      points: points,
      buttonText: req.body.buttonText || 'Read More',
      isActive: req.body.isActive === 'true'
    };
    
    await homePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'About created', data: addFullUrls(homePage.toObject(), baseUrl).about });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAbout = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage || !homePage.about) return res.status(404).json({ success: false, message: 'About not found' });
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ about: homePage.about }, baseUrl).about });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAbout = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage) return res.status(404).json({ success: false, message: 'Home page not found' });
    
    const image = req.file ? await saveFile(req.file, 'about') : req.body.image || homePage.about?.image;
    const points = req.body.points ? JSON.parse(req.body.points) : homePage.about?.points || [];
    
    homePage.about = {
      image: image || '',
      tag: req.body.tag || homePage.about?.tag,
      title: req.body.title || homePage.about?.title,
      description: req.body.description || homePage.about?.description,
      points: points,
      buttonText: req.body.buttonText || homePage.about?.buttonText || 'Read More',
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : homePage.about?.isActive
    };
    
    await homePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'About updated', data: addFullUrls(homePage.toObject(), baseUrl).about });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAbout = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage) return res.status(404).json({ success: false, message: 'Home page not found' });
    
    homePage.about = undefined;
    await homePage.save();
    res.json({ success: true, message: 'About deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ABOUT POINTS CRUD ====================
export const addAboutPoint = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage || !homePage.about) return res.status(404).json({ success: false, message: 'About section not found' });
    
    homePage.about.points.push({ point: req.body.point });
    await homePage.save();
    res.status(201).json({ success: true, message: 'Point added', data: homePage.about.points });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAboutPoint = async (req, res) => {
  try {
    const { index } = req.params;
    const homePage = await HomePage.findOne();
    if (!homePage || !homePage.about) return res.status(404).json({ success: false, message: 'About section not found' });
    
    if (index < 0 || index >= homePage.about.points.length) {
      return res.status(404).json({ success: false, message: 'Point not found' });
    }
    
    homePage.about.points[index].point = req.body.point;
    await homePage.save();
    res.json({ success: true, message: 'Point updated', data: homePage.about.points });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAboutPoint = async (req, res) => {
  try {
    const { index } = req.params;
    const homePage = await HomePage.findOne();
    if (!homePage || !homePage.about) return res.status(404).json({ success: false, message: 'About section not found' });
    
    if (index < 0 || index >= homePage.about.points.length) {
      return res.status(404).json({ success: false, message: 'Point not found' });
    }
    
    homePage.about.points.splice(index, 1);
    await homePage.save();
    res.json({ success: true, message: 'Point deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ACHIEVEMENTS SECTION CRUD ====================
export const createAchievements = async (req, res) => {
  try {
    let homePage = await HomePage.findOne();
    if (!homePage) homePage = new HomePage();
    
    let images = [];
    if (req.files && req.files.length) {
      for (const file of req.files) {
        const img = await saveFile(file, 'achievements');
        if (img) images.push(img);
      }
    } else if (req.body.images) {
      images = JSON.parse(req.body.images);
    }
    
    homePage.achievements = {
      yearsOfExperience: parseInt(req.body.yearsOfExperience) || 0,
      productsDelivered: parseInt(req.body.productsDelivered) || 0,
      clientSatisfaction: req.body.clientSatisfaction,
      quote: req.body.quote,
      images: images
    };
    
    await homePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Achievements created', data: addFullUrls(homePage.toObject(), baseUrl).achievements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAchievements = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage || !homePage.achievements) return res.status(404).json({ success: false, message: 'Achievements not found' });
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ achievements: homePage.achievements }, baseUrl).achievements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAchievements = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage) return res.status(404).json({ success: false, message: 'Home page not found' });
    
    let images = homePage.achievements?.images || [];
    if (req.files && req.files.length) {
      for (const file of req.files) {
        const img = await saveFile(file, 'achievements');
        if (img) images.push(img);
      }
    } else if (req.body.images) {
      images = JSON.parse(req.body.images);
    }
    
    homePage.achievements = {
      yearsOfExperience: req.body.yearsOfExperience !== undefined ? parseInt(req.body.yearsOfExperience) : homePage.achievements?.yearsOfExperience || 0,
      productsDelivered: req.body.productsDelivered !== undefined ? parseInt(req.body.productsDelivered) : homePage.achievements?.productsDelivered || 0,
      clientSatisfaction: req.body.clientSatisfaction || homePage.achievements?.clientSatisfaction,
      quote: req.body.quote || homePage.achievements?.quote,
      images: images
    };
    
    await homePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Achievements updated', data: addFullUrls(homePage.toObject(), baseUrl).achievements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAchievements = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage) return res.status(404).json({ success: false, message: 'Home page not found' });
    
    homePage.achievements = undefined;
    await homePage.save();
    res.json({ success: true, message: 'Achievements deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ACHIEVEMENT IMAGES CRUD ====================
export const addAchievementImage = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage || !homePage.achievements) return res.status(404).json({ success: false, message: 'Achievements section not found' });
    
    const image = req.file ? await saveFile(req.file, 'achievements') : req.body.image;
    homePage.achievements.images.push(image);
    await homePage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imagesWithUrls = homePage.achievements.images.map(img => img && !img.startsWith('http') ? `${baseUrl}${img}` : img);
    res.status(201).json({ success: true, message: 'Image added', data: imagesWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAchievementImage = async (req, res) => {
  try {
    const { index } = req.params;
    const homePage = await HomePage.findOne();
    if (!homePage || !homePage.achievements) return res.status(404).json({ success: false, message: 'Achievements section not found' });
    
    if (index < 0 || index >= homePage.achievements.images.length) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    const image = req.file ? await saveFile(req.file, 'achievements') : req.body.image;
    homePage.achievements.images[index] = image;
    await homePage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imagesWithUrls = homePage.achievements.images.map(img => img && !img.startsWith('http') ? `${baseUrl}${img}` : img);
    res.json({ success: true, message: 'Image updated', data: imagesWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAchievementImage = async (req, res) => {
  try {
    const { index } = req.params;
    const homePage = await HomePage.findOne();
    if (!homePage || !homePage.achievements) return res.status(404).json({ success: false, message: 'Achievements section not found' });
    
    if (index < 0 || index >= homePage.achievements.images.length) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    homePage.achievements.images.splice(index, 1);
    await homePage.save();
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== TESTIMONIALS SECTION CRUD ====================
export const createTestimonials = async (req, res) => {
  try {
    let homePage = await HomePage.findOne();
    if (!homePage) homePage = new HomePage();
    
    homePage.testimonials = {
      tag: req.body.tag,
      title: req.body.title,
      description: req.body.description,
      testimonials: [],
      isActive: req.body.isActive === 'true'
    };
    
    await homePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Testimonials section created', data: addFullUrls(homePage.toObject(), baseUrl).testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTestimonials = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage || !homePage.testimonials) return res.status(404).json({ success: false, message: 'Testimonials section not found' });
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ testimonials: homePage.testimonials }, baseUrl).testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTestimonials = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage) return res.status(404).json({ success: false, message: 'Home page not found' });
    
    homePage.testimonials = {
      tag: req.body.tag || homePage.testimonials?.tag,
      title: req.body.title || homePage.testimonials?.title,
      description: req.body.description || homePage.testimonials?.description,
      testimonials: homePage.testimonials?.testimonials || [],
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : homePage.testimonials?.isActive
    };
    
    await homePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Testimonials section updated', data: addFullUrls(homePage.toObject(), baseUrl).testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTestimonials = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage) return res.status(404).json({ success: false, message: 'Home page not found' });
    
    homePage.testimonials = undefined;
    await homePage.save();
    res.json({ success: true, message: 'Testimonials section deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== TESTIMONIAL ITEMS CRUD ====================
export const addTestimonial = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    if (!homePage || !homePage.testimonials) return res.status(404).json({ success: false, message: 'Testimonials section not found' });
    
    const image = req.file ? await saveFile(req.file, 'testimonials') : req.body.image;
    
    homePage.testimonials.testimonials.push({
      name: req.body.name,
      rating: parseInt(req.body.rating) || 5,
      image: image || '',
      role: req.body.role,
      review: req.body.review,
      isActive: true
    });
    
    await homePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const testimonialsWithUrls = homePage.testimonials.testimonials.map(t => ({
      ...t.toObject(),
      image: t.image && !t.image.startsWith('http') ? `${baseUrl}${t.image}` : t.image
    }));
    
    res.status(201).json({ success: true, message: 'Testimonial added', data: testimonialsWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTestimonial = async (req, res) => {
  try {
    const { index } = req.params;
    const homePage = await HomePage.findOne();
    if (!homePage || !homePage.testimonials) return res.status(404).json({ success: false, message: 'Testimonials section not found' });
    
    if (index < 0 || index >= homePage.testimonials.testimonials.length) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }
    
    const image = req.file ? await saveFile(req.file, 'testimonials') : req.body.image;
    
    homePage.testimonials.testimonials[index] = {
      name: req.body.name || homePage.testimonials.testimonials[index].name,
      rating: req.body.rating ? parseInt(req.body.rating) : homePage.testimonials.testimonials[index].rating,
      image: image || homePage.testimonials.testimonials[index].image,
      role: req.body.role || homePage.testimonials.testimonials[index].role,
      review: req.body.review || homePage.testimonials.testimonials[index].review,
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : homePage.testimonials.testimonials[index].isActive
    };
    
    await homePage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const testimonialsWithUrls = homePage.testimonials.testimonials.map(t => ({
      ...t.toObject(),
      image: t.image && !t.image.startsWith('http') ? `${baseUrl}${t.image}` : t.image
    }));
    
    res.json({ success: true, message: 'Testimonial updated', data: testimonialsWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTestimonial = async (req, res) => {
  try {
    const { index } = req.params;
    const homePage = await HomePage.findOne();
    if (!homePage || !homePage.testimonials) return res.status(404).json({ success: false, message: 'Testimonials section not found' });
    
    if (index < 0 || index >= homePage.testimonials.testimonials.length) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }
    
    homePage.testimonials.testimonials.splice(index, 1);
    await homePage.save();
    res.json({ success: true, message: 'Testimonial deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};