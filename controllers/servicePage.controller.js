import {ServicesPage, ServiceForm} from '../models/ServicePage.js';
import Notification from '../models/Notification.js';
import { createNotification } from './notification.controller.js';
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
  if (result.popup?.image && !result.popup.image.startsWith('http')) {
    result.popup.image = `${baseUrl}${result.popup.image}`;
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


// Helper: Create notification for admin
const createServiceNotification = async (serviceRequest, type = 'new') => {
  try {
    let title = '';
    let message = '';
    let priority = 'high';
    
    if (type === 'new') {
      title = `New Service Request`;
      message = `${serviceRequest.contactPerson} from ${serviceRequest.companyDetails} has submitted a service request for ${serviceRequest.instrumentType} (Model: ${serviceRequest.modelNo})`;
      priority = 'urgent';
    } else if (type === 'status') {
      title = `Service Request Status Updated`;
      message = `Service request for ${serviceRequest.instrumentType} (${serviceRequest.modelNo}) status changed to ${serviceRequest.status}`;
      priority = 'medium';
    }
    
    const notification = await Notification.create({
      type: 'service',
      title,
      message,
      referenceId: serviceRequest._id,
      referenceModel: 'ServiceForm',
      priority,
      data: {
        companyDetails: serviceRequest.companyDetails,
        contactPerson: serviceRequest.contactPerson,
        instrumentType: serviceRequest.instrumentType,
        modelNo: serviceRequest.modelNo,
        status: serviceRequest.status
      },
      isRead: false,
      isActive: true
    });
    
    return notification;
  } catch (error) {
    console.error('Create service notification error:', error);
    return null;
  }
};

// ==================== CREATE SERVICE REQUEST ====================

// @desc    Submit service request (Public)
// @route   POST /api/service-form/submit
export const submitServiceRequest = async (req, res) => {
  try {
    const {
      companyDetails, unit, location,
      contactPerson, designation,
      contactNo, email,
      instrumentType, modelNo, serialNo,
      natureOfProblem, contractType, poNumber
    } = req.body;

    // Validate required fields
    if (!companyDetails || !unit || !location || !contactPerson || !designation ||
        !contactNo || !email || !instrumentType || !modelNo || !serialNo ||
        !natureOfProblem || !contractType || !poNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Create service request
    const serviceRequest = await ServiceForm.create({
      companyDetails, unit, location,
      contactPerson, designation,
      contactNo, email,
      instrumentType, modelNo, serialNo,
      natureOfProblem, contractType, poNumber,
      status: 'pending',
      isActive: true
    });

    // Create notification for admin
    await createServiceNotification(serviceRequest, 'new');

    res.status(201).json({ 
      success: true, 
      message: 'Service request submitted successfully', 
      data: serviceRequest 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('Submit service request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET SERVICE REQUESTS ====================

// @desc    Get all service requests (Admin)
// @route   GET /api/service-form/admin
export const getAllServiceRequests = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };
    
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { companyDetails: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { instrumentType: { $regex: search, $options: 'i' } },
        { modelNo: { $regex: search, $options: 'i' } },
        { serialNo: { $regex: search, $options: 'i' } },
        { poNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [serviceRequests, total] = await Promise.all([
      ServiceForm.find(query)
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip),
      ServiceForm.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: serviceRequests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all service requests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get service request by ID (Admin)
// @route   GET /api/service-form/admin/:id
export const getServiceRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const serviceRequest = await ServiceForm.findById(id);
    
    if (!serviceRequest) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }
    
    res.json({ success: true, data: serviceRequest });
  } catch (error) {
    console.error('Get service request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get service requests by status (Admin)
// @route   GET /api/service-form/admin/status/:status
export const getServiceRequestsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const validStatuses = ['pending', 'assigned', 'in-progress', 'resolved', 'closed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [serviceRequests, total] = await Promise.all([
      ServiceForm.find({ status, isActive: true })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      ServiceForm.countDocuments({ status, isActive: true })
    ]);
    
    res.json({
      success: true,
      data: serviceRequests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get service requests by status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== UPDATE SERVICE REQUEST ====================

// @desc    Update service request status (Admin)
// @route   PUT /api/service-form/admin/:id/status
export const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'assigned', 'in-progress', 'resolved', 'closed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    
    const serviceRequest = await ServiceForm.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!serviceRequest) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }
    
    // Create notification for status change
    await createServiceNotification(serviceRequest, 'status');
    
    res.json({ 
      success: true, 
      message: 'Service request status updated successfully', 
      data: serviceRequest 
    });
  } catch (error) {
    console.error('Update service status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update service request (Admin)
// @route   PUT /api/service-form/admin/:id
export const updateServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const serviceRequest = await ServiceForm.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!serviceRequest) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Service request updated successfully', 
      data: serviceRequest 
    });
  } catch (error) {
    console.error('Update service request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== DELETE SERVICE REQUEST ====================

// @desc    Delete service request (Soft delete - Admin)
// @route   DELETE /api/service-form/admin/:id
export const deleteServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const serviceRequest = await ServiceForm.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!serviceRequest) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }
    
    res.json({ success: true, message: 'Service request deleted successfully' });
  } catch (error) {
    console.error('Delete service request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Permanent delete service request (Admin)
// @route   DELETE /api/service-form/admin/:id/permanent
export const permanentDeleteServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const serviceRequest = await ServiceForm.findByIdAndDelete(id);
    
    if (!serviceRequest) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }
    
    res.json({ success: true, message: 'Service request permanently deleted' });
  } catch (error) {
    console.error('Permanent delete service request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SERVICE REQUEST STATISTICS ====================

// @desc    Get service request statistics (Admin)
// @route   GET /api/service-form/admin/stats
export const getServiceStats = async (req, res) => {
  try {
    const total = await ServiceForm.countDocuments({ isActive: true });
    const pending = await ServiceForm.countDocuments({ status: 'pending', isActive: true });
    const assigned = await ServiceForm.countDocuments({ status: 'assigned', isActive: true });
    const inProgress = await ServiceForm.countDocuments({ status: 'in-progress', isActive: true });
    const resolved = await ServiceForm.countDocuments({ status: 'resolved', isActive: true });
    const closed = await ServiceForm.countDocuments({ status: 'closed', isActive: true });
    const cancelled = await ServiceForm.countDocuments({ status: 'cancelled', isActive: true });
    
    // Get recent requests (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent = await ServiceForm.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      isActive: true
    });
    
    res.json({
      success: true,
      data: {
        total,
        pending,
        assigned,
        inProgress,
        resolved,
        closed,
        cancelled,
        recent
      }
    });
  } catch (error) {
    console.error('Get service stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==================== POPUP SECTION CRUD ====================

// @desc    Create/Update popup image (Admin)
// @route   POST /api/servicepage/popup
export const createPopup = async (req, res) => {
  try {
    let servicesPage = await ServicesPage.findOne();
    if (!servicesPage) servicesPage = new ServicesPage();
    
    const image = req.file ? await saveFile(req.file, 'popup') : req.body.image;
    
    servicesPage.popup = {
      image: image || null,
      isActive: req.body.isActive === 'true' || req.body.isActive === true
    };
    
    await servicesPage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const popupData = servicesPage.popup;
    if (popupData.image && !popupData.image.startsWith('http')) {
      popupData.image = `${baseUrl}${popupData.image}`;
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Popup image created/updated successfully', 
      data: popupData 
    });
  } catch (error) {
    console.error('Create popup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update popup image (Admin)
// @route   PUT /api/servicepage/popup
export const updatePopup = async (req, res) => {
  try {
    let servicesPage = await ServicesPage.findOne();
    if (!servicesPage) {
      return res.status(404).json({ success: false, message: 'Services page not found' });
    }
    
    const image = req.file ? await saveFile(req.file, 'popup') : req.body.image;
    
    if (!servicesPage.popup) {
      servicesPage.popup = {};
    }
    
    if (image !== undefined) servicesPage.popup.image = image;
    if (req.body.isActive !== undefined) {
      servicesPage.popup.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    }
    
    await servicesPage.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const popupData = servicesPage.popup;
    if (popupData.image && !popupData.image.startsWith('http')) {
      popupData.image = `${baseUrl}${popupData.image}`;
    }
    
    res.json({ 
      success: true, 
      message: 'Popup image updated successfully', 
      data: popupData 
    });
  } catch (error) {
    console.error('Update popup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get popup image (Public)
// @route   GET /api/servicepage/popup
export const getPopup = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage || !servicesPage.popup) {
      return res.status(404).json({ success: false, message: 'Popup not found' });
    }
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const popupData = servicesPage.popup.toObject();
    if (popupData.image && !popupData.image.startsWith('http')) {
      popupData.image = `${baseUrl}${popupData.image}`;
    }
    
    res.json({ success: true, data: popupData });
  } catch (error) {
    console.error('Get popup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete popup image (Admin)
// @route   DELETE /api/servicepage/popup
export const deletePopup = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage) {
      return res.status(404).json({ success: false, message: 'Services page not found' });
    }
    
    servicesPage.popup = undefined;
    await servicesPage.save();
    
    res.json({ success: true, message: 'Popup image deleted successfully' });
  } catch (error) {
    console.error('Delete popup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};