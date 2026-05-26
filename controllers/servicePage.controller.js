import { ServicesPage, ServiceForm } from '../models/ServicePage.js';
import Notification from '../models/Notification.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Save uploaded file
const saveFile = async (file, folder) => {
  if (!file) return null;
  if (typeof file === 'string' && file.startsWith('http')) return file;
  
  const uploadDir = path.join(__dirname, '../uploads/servicespage', folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  
  const filename = `${folder}-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
  fs.copyFileSync(file.path, path.join(uploadDir, filename));
  try { fs.unlinkSync(file.path); } catch(e) {}
  
  return `/uploads/servicespage/${folder}/${filename}`;
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
  const sections = ['serviceHome', 'serviceSupport', 'popup'];
  sections.forEach(section => {
    if (result[section]?.image && !result[section].image.startsWith('http')) {
      result[section].image = `${baseUrl}${result[section].image}`;
    }
  });
  return result;
};

// Helper: Get or create page
const getOrCreatePage = async () => {
  let page = await ServicesPage.findOne();
  if (!page) page = new ServicesPage();
  return page;
};

// Helper: Generic section handlers
const handleSectionGet = async (req, res, sectionName, hasImage = false) => {
  try {
    const page = await ServicesPage.findOne();
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
    const points = config.hasPoints ? parseJSON(req.body.points) : [];
    const cards = config.hasCards ? parseJSON(req.body.cards) : [];
    
    page[sectionName] = {
      title: req.body.title,
      tag: req.body.tag,
      description: req.body.description,
      ...(config.hasImage && { image: image || req.body.image || '' }),
      ...(config.hasPoints && { points }),
      ...(config.hasCards && { cards }),
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
    const page = await ServicesPage.findOne();
    if (!page?.[sectionName]) {
      return res.status(404).json({ success: false, message: `${sectionName} not found. Use create first.` });
    }
    
    const image = config.hasImage && req.file ? await saveFile(req.file, config.folder || sectionName) : null;
    
    if (req.body.title !== undefined) page[sectionName].title = req.body.title;
    if (req.body.tag !== undefined) page[sectionName].tag = req.body.tag;
    if (req.body.description !== undefined) page[sectionName].description = req.body.description;
    if (image) page[sectionName].image = image;
    if (config.hasPoints && req.body.points !== undefined) page[sectionName].points = parseJSON(req.body.points);
    if (config.hasCards && req.body.cards !== undefined) page[sectionName].cards = parseJSON(req.body.cards);
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
    const page = await ServicesPage.findOne();
    if (!page) return res.status(404).json({ success: false, message: 'Services page not found' });
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
    const page = await ServicesPage.findOne();
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
    const page = await ServicesPage.findOne();
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
    const page = await ServicesPage.findOne();
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
export const getServicesPage = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne({ isActive: true });
    if (!servicesPage) return res.status(404).json({ success: false, message: 'Services page not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls(servicesPage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createServicesPage = async (req, res) => {
  try {
    if (await ServicesPage.findOne()) {
      return res.status(400).json({ success: false, message: 'Services page already exists. Use PUT to update.' });
    }
    const servicesPage = await ServicesPage.create(req.body);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Services page created', data: addFullUrls(servicesPage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateServicesPage = async (req, res) => {
  try {
    const servicesPage = await ServicesPage.findOne();
    if (!servicesPage) return res.status(404).json({ success: false, message: 'Services page not found' });
    
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

export const deleteServicesPage = async (req, res) => {
  try {
    await ServicesPage.deleteMany({});
    res.json({ success: true, message: 'Services page deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SERVICE HOME SECTION ====================
export const createServiceHome = (req, res) => handleSectionCreate(req, res, 'serviceHome', { hasImage: true, folder: 'servicehome' });
export const updateServiceHome = (req, res) => handleSectionUpdate(req, res, 'serviceHome', { hasImage: true, folder: 'servicehome' });
export const getServiceHome = (req, res) => handleSectionGet(req, res, 'serviceHome', true);
export const deleteServiceHome = (req, res) => handleSectionDelete(req, res, 'serviceHome');

// ==================== SERVICE HERO SECTION ====================
export const createServiceHero = (req, res) => handleSectionCreate(req, res, 'serviceHero', { hasPoints: true });
export const updateServiceHero = (req, res) => handleSectionUpdate(req, res, 'serviceHero', { hasPoints: true });
export const getServiceHero = (req, res) => handleSectionGet(req, res, 'serviceHero');
export const deleteServiceHero = (req, res) => handleSectionDelete(req, res, 'serviceHero');

export const addServiceHeroPoint = (req, res) => handleAddItem(req, res, 'serviceHero', 'points', ['point']);
export const updateServiceHeroPoint = (req, res) => handleUpdateItem(req, res, 'serviceHero', 'points', ['point']);
export const deleteServiceHeroPoint = (req, res) => handleDeleteItem(req, res, 'serviceHero', 'points');

// ==================== SERVICE CATALOGUE SECTION ====================
export const createServiceCatalogue = (req, res) => handleSectionCreate(req, res, 'serviceCatalogue', { hasCards: true });
export const updateServiceCatalogue = (req, res) => handleSectionUpdate(req, res, 'serviceCatalogue', { hasCards: true });
export const getServiceCatalogue = (req, res) => handleSectionGet(req, res, 'serviceCatalogue');
export const deleteServiceCatalogue = (req, res) => handleSectionDelete(req, res, 'serviceCatalogue');

export const addCatalogueCard = (req, res) => handleAddItem(req, res, 'serviceCatalogue', 'cards', ['title', 'icon', 'description']);
export const getAllCatalogueCards = async (req, res) => {
  try {
    const page = await ServicesPage.findOne();
    const cards = page?.serviceCatalogue?.cards;
    if (!cards) return res.status(404).json({ success: false, message: 'No cards found' });
    res.json({ success: true, data: cards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getCatalogueCardById = async (req, res) => {
  try {
    const page = await ServicesPage.findOne();
    const cards = page?.serviceCatalogue?.cards;
    const index = parseInt(req.params.index);
    if (!cards || isNaN(index) || index < 0 || index >= cards.length) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }
    res.json({ success: true, data: cards[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const updateCatalogueCard = (req, res) => handleUpdateItem(req, res, 'serviceCatalogue', 'cards', ['title', 'icon', 'description']);
export const deleteCatalogueCard = (req, res) => handleDeleteItem(req, res, 'serviceCatalogue', 'cards');

// ==================== SERVICE SUPPORT SECTION ====================
export const createServiceSupport = (req, res) => handleSectionCreate(req, res, 'serviceSupport', { hasImage: true, hasPoints: true, folder: 'servicesupport' });
export const updateServiceSupport = (req, res) => handleSectionUpdate(req, res, 'serviceSupport', { hasImage: true, hasPoints: true, folder: 'servicesupport' });
export const getServiceSupport = (req, res) => handleSectionGet(req, res, 'serviceSupport', true);
export const deleteServiceSupport = (req, res) => handleSectionDelete(req, res, 'serviceSupport');

export const addServiceSupportPoint = (req, res) => handleAddItem(req, res, 'serviceSupport', 'points', ['point']);
export const updateServiceSupportPoint = (req, res) => handleUpdateItem(req, res, 'serviceSupport', 'points', ['point']);
export const deleteServiceSupportPoint = (req, res) => handleDeleteItem(req, res, 'serviceSupport', 'points');

// ==================== POPUP SECTION ====================
export const createPopup = async (req, res) => {
  try {
    const page = await getOrCreatePage();
    const image = req.file ? await saveFile(req.file, 'popup') : req.body.image;
    page.popup = { image: image || null, isActive: toBoolean(req.body.isActive) };
    await page.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const popupData = page.popup;
    if (popupData.image && !popupData.image.startsWith('http')) popupData.image = `${baseUrl}${popupData.image}`;
    res.status(201).json({ success: true, message: 'Popup created/updated', data: popupData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePopup = async (req, res) => {
  try {
    const page = await ServicesPage.findOne();
    if (!page) return res.status(404).json({ success: false, message: 'Services page not found' });
    if (!page.popup) page.popup = {};
    
    const image = req.file ? await saveFile(req.file, 'popup') : req.body.image;
    if (image !== undefined) page.popup.image = image;
    if (req.body.isActive !== undefined) page.popup.isActive = toBoolean(req.body.isActive);
    
    await page.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const popupData = page.popup;
    if (popupData.image && !popupData.image.startsWith('http')) popupData.image = `${baseUrl}${popupData.image}`;
    res.json({ success: true, message: 'Popup updated', data: popupData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPopup = async (req, res) => {
  try {
    const page = await ServicesPage.findOne();
    
    if (!page?.popup || !page.popup.image) {
      return res.json({ 
        success: true, 
        data: {
          image: null,
          isActive: false,
          _id: page?.popup?._id || null
        }
      });
    }
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const popupData = page.popup.toObject();
    
    if (!popupData.image.startsWith('http')) {
      popupData.image = `${baseUrl}${popupData.image}`;
    }
    
    res.json({ success: true, data: popupData });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const deletePopup = async (req, res) => {
  try {
    const page = await ServicesPage.findOne();
    if (!page) return res.status(404).json({ success: false, message: 'Services page not found' });
    page.popup = undefined;
    await page.save();
    res.json({ success: true, message: 'Popup deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SERVICE FORM REQUESTS ====================
const createServiceNotification = async (serviceRequest, type = 'new') => {
  try {
    const title = type === 'new' ? 'New Service Request' : 'Service Request Status Updated';
    const message = type === 'new' 
      ? `${serviceRequest.contactPerson} from ${serviceRequest.companyDetails} has submitted a service request for ${serviceRequest.instrumentType} (Model: ${serviceRequest.modelNo})`
      : `Service request for ${serviceRequest.instrumentType} (${serviceRequest.modelNo}) status changed to ${serviceRequest.status}`;
    
    return await Notification.create({
      type: 'service', title, message, referenceId: serviceRequest._id, referenceModel: 'ServiceForm',
      priority: type === 'new' ? 'urgent' : 'medium',
      data: { companyDetails: serviceRequest.companyDetails, contactPerson: serviceRequest.contactPerson, instrumentType: serviceRequest.instrumentType, modelNo: serviceRequest.modelNo, status: serviceRequest.status },
      isRead: false, isActive: true
    });
  } catch (error) {
    return null;
  }
};

export const submitServiceRequest = async (req, res) => {
  try {
    const required = ['companyDetails', 'unit', 'location', 'contactPerson', 'designation', 'contactNo', 'email', 'instrumentType', 'modelNo', 'serialNo', 'natureOfProblem', 'contractType', 'poNumber'];
    const missing = required.find(field => !req.body[field]);
    if (missing) return res.status(400).json({ success: false, message: `${missing} is required` });
    
    const serviceRequest = await ServiceForm.create({ ...req.body, status: 'pending', isActive: true });
    await createServiceNotification(serviceRequest, 'new');
    res.status(201).json({ success: true, message: 'Service request submitted successfully', data: serviceRequest });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(error.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllServiceRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = { isActive: true };
    if (status) query.status = status;
    if (search) query.$or = ['companyDetails', 'contactPerson', 'instrumentType', 'modelNo', 'serialNo', 'poNumber'].map(f => ({ [f]: { $regex: search, $options: 'i' } }));
    
    const [data, total] = await Promise.all([
      ServiceForm.find(query).sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 }).skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit)),
      ServiceForm.countDocuments(query)
    ]);
    res.json({ success: true, data, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getServiceRequestById = async (req, res) => {
  try {
    const serviceRequest = await ServiceForm.findById(req.params.id);
    if (!serviceRequest) return res.status(404).json({ success: false, message: 'Service request not found' });
    res.json({ success: true, data: serviceRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getServiceRequestsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const valid = ['pending', 'assigned', 'in-progress', 'resolved', 'closed', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    
    const [data, total] = await Promise.all([
      ServiceForm.find({ status, isActive: true }).sort({ createdAt: -1 }).skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit)),
      ServiceForm.countDocuments({ status, isActive: true })
    ]);
    res.json({ success: true, data, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateServiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'assigned', 'in-progress', 'resolved', 'closed', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    
    const serviceRequest = await ServiceForm.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!serviceRequest) return res.status(404).json({ success: false, message: 'Service request not found' });
    await createServiceNotification(serviceRequest, 'status');
    res.json({ success: true, message: 'Status updated', data: serviceRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateServiceRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceForm.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!serviceRequest) return res.status(404).json({ success: false, message: 'Service request not found' });
    res.json({ success: true, message: 'Service request updated', data: serviceRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteServiceRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceForm.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!serviceRequest) return res.status(404).json({ success: false, message: 'Service request not found' });
    res.json({ success: true, message: 'Service request deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const permanentDeleteServiceRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceForm.findByIdAndDelete(req.params.id);
    if (!serviceRequest) return res.status(404).json({ success: false, message: 'Service request not found' });
    res.json({ success: true, message: 'Service request permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getServiceStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const statuses = ['pending', 'assigned', 'in-progress', 'resolved', 'closed', 'cancelled'];
    const counts = await Promise.all([
      ServiceForm.countDocuments({ isActive: true }),
      ...statuses.map(s => ServiceForm.countDocuments({ status: s, isActive: true })),
      ServiceForm.countDocuments({ createdAt: { $gte: sevenDaysAgo }, isActive: true })
    ]);
    
    const [total, ...statusCounts] = counts;
    const stats = { total, recent: counts[counts.length - 1] };
    statuses.forEach((status, i) => { stats[status] = statusCounts[i]; });
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};