import ServicesPage from '../models/ServicePage.js';
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
  
  const uploadDir = path.join(__dirname, '../uploads/servicespage', folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname);
  const filename = `${folder}-${timestamp}-${random}${ext}`;
  const destPath = path.join(uploadDir, filename);
  
  fs.copyFileSync(file.path, destPath);
  try { fs.unlinkSync(file.path); } catch(e) {}
  
  return `/uploads/servicespage/${folder}/${filename}`;
};

// Helper: Add full URLs to response
const addFullUrls = (data, baseUrl) => {
  const result = { ...data };
  
  if (result.serviceHome?.image && !result.serviceHome.image.startsWith('http')) {
    result.serviceHome.image = `${baseUrl}${result.serviceHome.image}`;
  }
  if (result.serviceSupport?.image && !result.serviceSupport.image.startsWith('http')) {
    result.serviceSupport.image = `${baseUrl}${result.serviceSupport.image}`;
  }
  
  return result;
};

// ==================== FULL PAGE CRUD ====================

// Get Services Page (Public)
export const getServicesPage = async (req, res) => {
  try {
    let servicesPage = await ServicesPage.findOne({ isActive: true });
    if (!servicesPage) {
      return res.status(404).json({ success: false, message: 'Services page not found' });
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls(servicesPage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create Services Page (Admin)
export const createServicesPage = async (req, res) => {
  try {
    const existingPage = await ServicesPage.findOne();
    if (existingPage) {
      return res.status(400).json({ success: false, message: 'Services page already exists. Use PUT to update.' });
    }
    
    const servicesPage = await ServicesPage.create(req.body);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Services page created', data: addFullUrls(servicesPage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Services Page (Admin)
export const updateServicesPage = async (req, res) => {
  try {
    let servicesPage = await ServicesPage.findOne();
    if (!servicesPage) {
      return res.status(404).json({ success: false, message: 'Services page not found' });
    }
    
    const { serviceHome, serviceHero, serviceCatalogue, serviceSupport, isActive } = req.body;
    if (serviceHome) servicesPage.serviceHome = serviceHome;
    if (serviceHero) servicesPage.serviceHero = serviceHero;
    if (serviceCatalogue) servicesPage.serviceCatalogue = serviceCatalogue;
    if (serviceSupport) servicesPage.serviceSupport = serviceSupport;
    if (isActive !== undefined) servicesPage.isActive = isActive;
    
    await servicesPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Services page updated', data: addFullUrls(servicesPage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Services Page (Admin)
export const deleteServicesPage = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage) {
      return res.status(404).json({ success: false, message: 'Services page not found' });
    }
    await ServicesPage.deleteMany({});
    res.json({ success: true, message: 'Services page deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SERVICE HOME SECTION CRUD ====================

// Create Service Home
export const createServiceHome = async (req, res) => {
  try {
    let servicesPage = await ServicesPage.findOne();
    if (!servicesPage) servicesPage = new ServicesPage();
    
    if (servicesPage.serviceHome) {
      return res.status(400).json({ success: false, message: 'Service home already exists. Use updateServiceHome to update.' });
    }
    
    const image = req.file ? await saveFile(req.file, 'servicehome') : req.body.image;
    servicesPage.serviceHome = {
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description,
      image: image || '',
      isActive: req.body.isActive
    };
    await servicesPage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Service home created', data: addFullUrls(servicesPage.toObject(), baseUrl).serviceHome });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Service Home
export const updateServiceHome = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceHome) {
      return res.status(404).json({ success: false, message: 'Service home not found. Use createServiceHome first.' });
    }
    
    const image = req.file ? await saveFile(req.file, 'servicehome') : req.body.image;
    if (req.body.title) servicesPage.serviceHome.title = req.body.title;
    if (req.body.tag) servicesPage.serviceHome.tag = req.body.tag;
    if (req.body.description) servicesPage.serviceHome.description = req.body.description;
    if (image) servicesPage.serviceHome.image = image;
    if (req.body.isActive !== undefined) servicesPage.serviceHome.isActive = req.body.isActive;
    
    await servicesPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Service home updated', data: addFullUrls(servicesPage.toObject(), baseUrl).serviceHome });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Service Home
export const getServiceHome = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceHome) return res.status(404).json({ success: false, message: 'Service home not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ serviceHome: servicesPage.serviceHome }, baseUrl).serviceHome });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Service Home
export const deleteServiceHome = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage) return res.status(404).json({ success: false, message: 'Services page not found' });
    servicesPage.serviceHome = undefined;
    await servicesPage.save();
    res.json({ success: true, message: 'Service home deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SERVICE HERO SECTION CRUD ====================

// Create Service Hero
export const createServiceHero = async (req, res) => {
  try {
    let servicesPage = await ServicesPage.findOne();
    if (!servicesPage) servicesPage = new ServicesPage();
    
    if (servicesPage.serviceHero) {
      return res.status(400).json({ success: false, message: 'Service hero already exists. Use updateServiceHero to update.' });
    }
    
    const points = req.body.points ? JSON.parse(req.body.points) : [];
    servicesPage.serviceHero = {
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description,
      points: points,
      isActive: req.body.isActive
    };
    await servicesPage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Service hero created', data: addFullUrls(servicesPage.toObject(), baseUrl).serviceHero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateServiceHero = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceHero) {
      return res.status(404).json({ success: false, message: 'Service hero not found. Use createServiceHero first.' });
    }
    
    // Update fields with proper type handling
    if (req.body.title !== undefined) servicesPage.serviceHero.title = req.body.title;
    if (req.body.tag !== undefined) servicesPage.serviceHero.tag = req.body.tag;
    if (req.body.description !== undefined) servicesPage.serviceHero.description = req.body.description;
    
    // Handle points - parse if it's a string
    if (req.body.points !== undefined) {
      if (typeof req.body.points === 'string') {
        servicesPage.serviceHero.points = JSON.parse(req.body.points);
      } else {
        servicesPage.serviceHero.points = req.body.points;
      }
    }
    
    // Handle isActive - convert string to boolean if needed
    if (req.body.isActive !== undefined) {
      if (typeof req.body.isActive === 'string') {
        servicesPage.serviceHero.isActive = req.body.isActive === 'true';
      } else {
        servicesPage.serviceHero.isActive = req.body.isActive;
      }
    }
    
    await servicesPage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const updatedData = addFullUrls(servicesPage.toObject(), baseUrl);
    
    res.json({ 
      success: true, 
      message: 'Service hero updated', 
      data: updatedData.serviceHero 
    });
  } catch (error) {
    console.error('Update service hero error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Service Hero
export const getServiceHero = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceHero) return res.status(404).json({ success: false, message: 'Service hero not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ serviceHero: servicesPage.serviceHero }, baseUrl).serviceHero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add Service Hero Point
export const addServiceHeroPoint = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceHero) {
      return res.status(404).json({ success: false, message: 'Service hero not found' });
    }
    
    servicesPage.serviceHero.points.push({ point: req.body.point, isActive: true });
    await servicesPage.save();
    res.status(201).json({ success: true, message: 'Point added', data: servicesPage.serviceHero.points });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Service Hero Point
export const updateServiceHeroPoint = async (req, res) => {
  try {
    const { index } = req.params;
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceHero || !servicesPage.serviceHero.points || index < 0 || index >= servicesPage.serviceHero.points.length) {
      return res.status(404).json({ success: false, message: 'Point not found' });
    }
    
    if (req.body.point) servicesPage.serviceHero.points[index].point = req.body.point;
    if (req.body.isActive !== undefined) servicesPage.serviceHero.points[index].isActive = req.body.isActive;
    
    await servicesPage.save();
    res.json({ success: true, message: 'Point updated', data: servicesPage.serviceHero.points[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Service Hero Point
export const deleteServiceHeroPoint = async (req, res) => {
  try {
    const { index } = req.params;
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceHero || !servicesPage.serviceHero.points || index < 0 || index >= servicesPage.serviceHero.points.length) {
      return res.status(404).json({ success: false, message: 'Point not found' });
    }
    
    servicesPage.serviceHero.points.splice(index, 1);
    await servicesPage.save();
    res.json({ success: true, message: 'Point deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Service Hero
export const deleteServiceHero = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage) return res.status(404).json({ success: false, message: 'Services page not found' });
    servicesPage.serviceHero = undefined;
    await servicesPage.save();
    res.json({ success: true, message: 'Service hero deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SERVICE CATALOGUE SECTION CRUD ====================

// Create Service Catalogue
export const createServiceCatalogue = async (req, res) => {
  try {
    let servicesPage = await ServicesPage.findOne();
    if (!servicesPage) servicesPage = new ServicesPage();
    
    if (servicesPage.serviceCatalogue) {
      return res.status(400).json({ success: false, message: 'Service catalogue already exists. Use updateServiceCatalogue to update.' });
    }
    
    const cards = req.body.cards ? JSON.parse(req.body.cards) : [];
    servicesPage.serviceCatalogue = {
      title: req.body.title,
      tag: req.body.tag,
      cards: cards,
      isActive: req.body.isActive
    };
    await servicesPage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Service catalogue created', data: addFullUrls(servicesPage.toObject(), baseUrl).serviceCatalogue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Service Catalogue
export const updateServiceCatalogue = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceCatalogue) {
      return res.status(404).json({ success: false, message: 'Service catalogue not found. Use createServiceCatalogue first.' });
    }
    
    if (req.body.title) servicesPage.serviceCatalogue.title = req.body.title;
    if (req.body.tag) servicesPage.serviceCatalogue.tag = req.body.tag;
    if (req.body.cards) servicesPage.serviceCatalogue.cards = JSON.parse(req.body.cards);
    if (req.body.isActive !== undefined) servicesPage.serviceCatalogue.isActive = req.body.isActive;
    
    await servicesPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Service catalogue updated', data: addFullUrls(servicesPage.toObject(), baseUrl).serviceCatalogue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Service Catalogue
export const getServiceCatalogue = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceCatalogue) return res.status(404).json({ success: false, message: 'Service catalogue not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ serviceCatalogue: servicesPage.serviceCatalogue }, baseUrl).serviceCatalogue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add Catalogue Card
export const addCatalogueCard = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceCatalogue) {
      return res.status(404).json({ success: false, message: 'Service catalogue not found' });
    }
    
    servicesPage.serviceCatalogue.cards.push({
      title: req.body.title,
      icon: req.body.icon || '',
      description: req.body.description,
      isActive: true
    });
    await servicesPage.save();
    res.status(201).json({ success: true, message: 'Card added', data: servicesPage.serviceCatalogue.cards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Catalogue Cards
export const getAllCatalogueCards = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceCatalogue || !servicesPage.serviceCatalogue.cards) {
      return res.status(404).json({ success: false, message: 'No cards found' });
    }
    res.json({ success: true, data: servicesPage.serviceCatalogue.cards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Catalogue Card
export const getCatalogueCardById = async (req, res) => {
  try {
    const { index } = req.params;
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceCatalogue || !servicesPage.serviceCatalogue.cards || index < 0 || index >= servicesPage.serviceCatalogue.cards.length) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }
    res.json({ success: true, data: servicesPage.serviceCatalogue.cards[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Catalogue Card
export const updateCatalogueCard = async (req, res) => {
  try {
    const { index } = req.params;
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceCatalogue || !servicesPage.serviceCatalogue.cards || index < 0 || index >= servicesPage.serviceCatalogue.cards.length) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }
    
    if (req.body.title) servicesPage.serviceCatalogue.cards[index].title = req.body.title;
    if (req.body.icon !== undefined) servicesPage.serviceCatalogue.cards[index].icon = req.body.icon;
    if (req.body.description) servicesPage.serviceCatalogue.cards[index].description = req.body.description;
    if (req.body.isActive !== undefined) servicesPage.serviceCatalogue.cards[index].isActive = req.body.isActive;
    
    await servicesPage.save();
    res.json({ success: true, message: 'Card updated', data: servicesPage.serviceCatalogue.cards[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Catalogue Card
export const deleteCatalogueCard = async (req, res) => {
  try {
    const { index } = req.params;
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceCatalogue || !servicesPage.serviceCatalogue.cards || index < 0 || index >= servicesPage.serviceCatalogue.cards.length) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }
    
    servicesPage.serviceCatalogue.cards.splice(index, 1);
    await servicesPage.save();
    res.json({ success: true, message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Service Catalogue
export const deleteServiceCatalogue = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage) return res.status(404).json({ success: false, message: 'Services page not found' });
    servicesPage.serviceCatalogue = undefined;
    await servicesPage.save();
    res.json({ success: true, message: 'Service catalogue deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SERVICE SUPPORT SECTION CRUD ====================

// Create Service Support
export const createServiceSupport = async (req, res) => {
  try {
    let servicesPage = await ServicesPage.findOne();
    if (!servicesPage) servicesPage = new ServicesPage();
    
    if (servicesPage.serviceSupport) {
      return res.status(400).json({ success: false, message: 'Service support already exists. Use updateServiceSupport to update.' });
    }
    
    const points = req.body.points ? JSON.parse(req.body.points) : [];
    servicesPage.serviceSupport = {
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description,
      points: points,
      isActive: req.body.isActive
    };
    await servicesPage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Service support created', data: addFullUrls(servicesPage.toObject(), baseUrl).serviceSupport });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Service Support
export const updateServiceSupport = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceSupport) {
      return res.status(404).json({ success: false, message: 'Service support not found. Use createServiceSupport first.' });
    }
    
    if (req.body.title) servicesPage.serviceSupport.title = req.body.title;
    if (req.body.tag) servicesPage.serviceSupport.tag = req.body.tag;
    if (req.body.description) servicesPage.serviceSupport.description = req.body.description;
    if (req.body.points) servicesPage.serviceSupport.points = JSON.parse(req.body.points);
    if (req.body.isActive !== undefined) servicesPage.serviceSupport.isActive = req.body.isActive;
    
    await servicesPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Service support updated', data: addFullUrls(servicesPage.toObject(), baseUrl).serviceSupport });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Service Support
export const getServiceSupport = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceSupport) return res.status(404).json({ success: false, message: 'Service support not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ serviceSupport: servicesPage.serviceSupport }, baseUrl).serviceSupport });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add Service Support Point
export const addServiceSupportPoint = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceSupport) {
      return res.status(404).json({ success: false, message: 'Service support not found' });
    }
    
    servicesPage.serviceSupport.points.push({ point: req.body.point, isActive: true });
    await servicesPage.save();
    res.status(201).json({ success: true, message: 'Point added', data: servicesPage.serviceSupport.points });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Service Support Point
export const updateServiceSupportPoint = async (req, res) => {
  try {
    const { index } = req.params;
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceSupport || !servicesPage.serviceSupport.points || index < 0 || index >= servicesPage.serviceSupport.points.length) {
      return res.status(404).json({ success: false, message: 'Point not found' });
    }
    
    if (req.body.point) servicesPage.serviceSupport.points[index].point = req.body.point;
    if (req.body.isActive !== undefined) servicesPage.serviceSupport.points[index].isActive = req.body.isActive;
    
    await servicesPage.save();
    res.json({ success: true, message: 'Point updated', data: servicesPage.serviceSupport.points[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Service Support Point
export const deleteServiceSupportPoint = async (req, res) => {
  try {
    const { index } = req.params;
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.serviceSupport || !servicesPage.serviceSupport.points || index < 0 || index >= servicesPage.serviceSupport.points.length) {
      return res.status(404).json({ success: false, message: 'Point not found' });
    }
    
    servicesPage.serviceSupport.points.splice(index, 1);
    await servicesPage.save();
    res.json({ success: true, message: 'Point deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Service Support
export const deleteServiceSupport = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage) return res.status(404).json({ success: false, message: 'Services page not found' });
    servicesPage.serviceSupport = undefined;
    await servicesPage.save();
    res.json({ success: true, message: 'Service support deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};