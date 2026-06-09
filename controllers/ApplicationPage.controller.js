// controllers/applicationPageController.js
import { Hero, MainCard, Services, ServiceCard, CTA } from '../models/ApplicationPage.js';
import fs from 'fs';
import path from 'path';

// Helper to delete image
const deleteImage = (imagePath) => {
  if (imagePath && fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }
};

// Helper to get full image URL
const getImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}${imagePath}`;
};


// ==================== APPLICATION PAGE CONTROLLER ====================

export const getApplicationPage = async (req, res) => {
  try {
    // Fetch all sections in parallel
    const [heroes, mainCards, servicesList, ctaList] = await Promise.all([
      Hero.find().sort({ createdAt: -1 }),
      MainCard.find().sort({ createdAt: -1 }),
      Services.find().sort({ createdAt: -1 }),
      CTA.find().sort({ createdAt: -1 })
    ]);

    // Get the latest hero (with image URL)
    const latestHero = heroes[0] || null;
    let heroWithUrl = null;
    if (latestHero) {
      heroWithUrl = latestHero.toObject();
      heroWithUrl.imageUrl = getImageUrl(req, latestHero.image);
    }

    // Get the latest services (with all its nested cards)
    const latestServices = servicesList[0] || null;

    // Get the latest CTA
    const latestCTA = ctaList[0] || null;

    // Build complete response
    const applicationPage = {
      hero: heroWithUrl,
      mainCards: mainCards,
      services: latestServices,
      cta: latestCTA,
      metadata: {
        totalMainCards: mainCards.length,
        totalServiceCards: latestServices?.cards?.length || 0,
        lastUpdated: new Date().toISOString()
      }
    };

    res.json({ 
      success: true, 
      data: applicationPage 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== HERO SECTION WITH IMAGE URL ====================

export const createHero = async (req, res) => {
  try {
    const { title, tag, metaTag, description, buttonText, imageUrl } = req.body;
    
    let imagePath = null;
    
    // Handle file upload
    if (req.file) {
      imagePath = `/uploads/application-pages/hero/${req.file.filename}`;
    }
    // Handle external image URL
    else if (imageUrl) {
      imagePath = imageUrl;
    }
    
    const hero = await Hero.create({
      title,
      tag,
      metaTag,
      description,
      buttonText,
      image: imagePath
    });
    
    // Return with full image URL
    const heroObj = hero.toObject();
    heroObj.imageUrl = getImageUrl(req, hero.image);
    
    res.status(201).json({ 
      success: true, 
      message: 'Hero created successfully', 
      data: heroObj 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllHero = async (req, res) => {
  try {
    const heroes = await Hero.find().sort({ createdAt: -1 });
    
    // Add imageUrl to each hero
    const heroesWithUrl = heroes.map(hero => {
      const heroObj = hero.toObject();
      heroObj.imageUrl = getImageUrl(req, hero.image);
      return heroObj;
    });
    
    res.json({ success: true, data: heroesWithUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHeroById = async (req, res) => {
  try {
    const hero = await Hero.findById(req.params.id);
    if (!hero) return res.status(404).json({ success: false, message: 'Hero not found' });
    
    const heroObj = hero.toObject();
    heroObj.imageUrl = getImageUrl(req, hero.image);
    
    res.json({ success: true, data: heroObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHero = async (req, res) => {
  try {
    const hero = await Hero.findById(req.params.id);
    if (!hero) return res.status(404).json({ success: false, message: 'Hero not found' });
    
    const { title, tag, metaTag, description, buttonText, imageUrl } = req.body;
    
    // Handle file upload (priority over URL)
    if (req.file) {
      // Delete old image if it's a local file
      if (hero.image && !hero.image.startsWith('http')) {
        const oldImagePath = path.join(process.cwd(), hero.image);
        deleteImage(oldImagePath);
      }
      hero.image = `/uploads/application-pages/hero/${req.file.filename}`;
    }
    // Handle external image URL
    else if (imageUrl !== undefined) {
      // Delete old local image if exists
      if (hero.image && !hero.image.startsWith('http')) {
        const oldImagePath = path.join(process.cwd(), hero.image);
        deleteImage(oldImagePath);
      }
      hero.image = imageUrl;
    }
    
    // Update text fields
    if (title) hero.title = title;
    if (tag !== undefined) hero.tag = tag;
    if (metaTag !== undefined) hero.metaTag = metaTag;
    if (description) hero.description = description;
    if (buttonText) hero.buttonText = buttonText;
    
    await hero.save();
    
    const heroObj = hero.toObject();
    heroObj.imageUrl = getImageUrl(req, hero.image);
    
    res.json({ success: true, message: 'Hero updated successfully', data: heroObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteHero = async (req, res) => {
  try {
    const hero = await Hero.findById(req.params.id);
    if (!hero) return res.status(404).json({ success: false, message: 'Hero not found' });
    
    // Delete local image if exists (not external URL)
    if (hero.image && !hero.image.startsWith('http')) {
      const imagePath = path.join(process.cwd(), hero.image);
      deleteImage(imagePath);
    }
    
    await hero.deleteOne();
    res.json({ success: true, message: 'Hero deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== MAIN CARDS SECTION ====================

export const createMainCard = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }
    const card = await MainCard.create({ title, description });
    res.status(201).json({ success: true, message: 'Card created successfully', data: card });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllMainCards = async (req, res) => {
  try {
    const cards = await MainCard.find().sort({ createdAt: -1 });
    res.json({ success: true, data: cards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMainCardById = async (req, res) => {
  try {
    const card = await MainCard.findById(req.params.id);
    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });
    res.json({ success: true, data: card });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMainCard = async (req, res) => {
  try {
    const card = await MainCard.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });
    res.json({ success: true, message: 'Card updated successfully', data: card });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMainCard = async (req, res) => {
  try {
    const card = await MainCard.findByIdAndDelete(req.params.id);
    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });
    res.json({ success: true, message: 'Card deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SERVICES SECTION ====================

export const createServices = async (req, res) => {
  try {
    const { tag, title, description, cards } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
    
    const services = await Services.create({ tag, title, description, cards: cards || [] });
    res.status(201).json({ success: true, message: 'Services created successfully', data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllServices = async (req, res) => {
  try {
    const services = await Services.find().sort({ createdAt: -1 });
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getServicesById = async (req, res) => {
  try {
    const services = await Services.findById(req.params.id);
    if (!services) return res.status(404).json({ success: false, message: 'Services not found' });
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateServices = async (req, res) => {
  try {
    const services = await Services.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!services) return res.status(404).json({ success: false, message: 'Services not found' });
    res.json({ success: true, message: 'Services updated successfully', data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteServices = async (req, res) => {
  try {
    const services = await Services.findByIdAndDelete(req.params.id);
    if (!services) return res.status(404).json({ success: false, message: 'Services not found' });
    res.json({ success: true, message: 'Services deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Service Cards (nested inside Services)
export const addServiceCard = async (req, res) => {
  try {
    const { servicesId } = req.params;
    const { title, description } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }
    
    const services = await Services.findById(servicesId);
    if (!services) return res.status(404).json({ success: false, message: 'Services not found' });
    
    services.cards.push({ title, description });
    await services.save();
    
    const newCard = services.cards[services.cards.length - 1];
    res.status(201).json({ success: true, message: 'Service card added successfully', data: newCard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateServiceCard = async (req, res) => {
  try {
    const { servicesId, cardId } = req.params;
    const { title, description } = req.body;
    
    const services = await Services.findById(servicesId);
    if (!services) return res.status(404).json({ success: false, message: 'Services not found' });
    
    const card = services.cards.id(cardId);
    if (!card) return res.status(404).json({ success: false, message: 'Service card not found' });
    
    if (title) card.title = title;
    if (description) card.description = description;
    await services.save();
    
    res.json({ success: true, message: 'Service card updated successfully', data: card });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteServiceCard = async (req, res) => {
  try {
    const { servicesId, cardId } = req.params;
    
    const services = await Services.findById(servicesId);
    if (!services) return res.status(404).json({ success: false, message: 'Services not found' });
    
    services.cards.pull(cardId);
    await services.save();
    
    res.json({ success: true, message: 'Service card deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CTA SECTION ====================

export const createCTA = async (req, res) => {
  try {
    const { tag, title, description, buttonText } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }
    const cta = await CTA.create({ tag, title, description, buttonText });
    res.status(201).json({ success: true, message: 'CTA created successfully', data: cta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllCTA = async (req, res) => {
  try {
    const ctaList = await CTA.find().sort({ createdAt: -1 });
    res.json({ success: true, data: ctaList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCTAById = async (req, res) => {
  try {
    const cta = await CTA.findById(req.params.id);
    if (!cta) return res.status(404).json({ success: false, message: 'CTA not found' });
    res.json({ success: true, data: cta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCTA = async (req, res) => {
  try {
    const cta = await CTA.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cta) return res.status(404).json({ success: false, message: 'CTA not found' });
    res.json({ success: true, message: 'CTA updated successfully', data: cta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCTA = async (req, res) => {
  try {
    const cta = await CTA.findByIdAndDelete(req.params.id);
    if (!cta) return res.status(404).json({ success: false, message: 'CTA not found' });
    res.json({ success: true, message: 'CTA deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};