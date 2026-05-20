import express from 'express';
import multer from 'multer';
import {
  getServicesPage,
  createServicesPage,
  updateServicesPage,
  deleteServicesPage,
  createServiceHome,
  updateServiceHome,
  getServiceHome,
  deleteServiceHome,
  createServiceHero,
  updateServiceHero,
  getServiceHero,
  addServiceHeroPoint,
  updateServiceHeroPoint,
  deleteServiceHeroPoint,
  deleteServiceHero,
  createServiceCatalogue,
  updateServiceCatalogue,
  getServiceCatalogue,
  addCatalogueCard,
  getAllCatalogueCards,
  getCatalogueCardById,
  updateCatalogueCard,
  deleteCatalogueCard,
  deleteServiceCatalogue,
  createServiceSupport,
  updateServiceSupport,
  getServiceSupport,
  addServiceSupportPoint,
  updateServiceSupportPoint,
  deleteServiceSupportPoint,
  deleteServiceSupport,
  submitServiceRequest,
  getAllServiceRequests,
  getServiceRequestById,
  getServiceRequestsByStatus,
  updateServiceStatus,
  updateServiceRequest,
  deleteServiceRequest,
  permanentDeleteServiceRequest,
  getServiceStats,
  // Popup functions
  createPopup,
  updatePopup,
  getPopup,
  deletePopup
} from '../controllers/servicePage.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// ==================== PUBLIC ROUTES ====================
router.get('/', getServicesPage);
router.get('/popup', getPopup);  
router.post('/submit', submitServiceRequest);

// ==================== FULL PAGE CRUD (ADMIN ONLY) ====================
router.post('/', protect, authorize('admin'), createServicesPage);
router.put('/', protect, authorize('admin'), updateServicesPage);
router.delete('/', protect, authorize('admin'), deleteServicesPage);

// ==================== POPUP CRUD (ADMIN ONLY) ====================
router.post('/popup', protect, authorize('admin'), upload.single('image'), createPopup);
router.put('/popup', protect, authorize('admin'), upload.single('image'), updatePopup);
router.delete('/popup', protect, authorize('admin'), deletePopup);

// ==================== SERVICE HOME CRUD (ADMIN ONLY) ====================
router.post('/service-home', protect, authorize('admin'), upload.single('image'), createServiceHome);
router.put('/service-home', protect, authorize('admin'), upload.single('image'), updateServiceHome);
router.get('/service-home', protect, authorize('admin'), getServiceHome);
router.delete('/service-home', protect, authorize('admin'), deleteServiceHome);

// ==================== SERVICE HERO CRUD (ADMIN ONLY) ====================
router.post('/service-hero', protect, authorize('admin'), createServiceHero);
router.put('/service-hero', protect, authorize('admin'), updateServiceHero);
router.get('/service-hero', protect, authorize('admin'), getServiceHero);
router.post('/service-hero/points', protect, authorize('admin'), addServiceHeroPoint);
router.put('/service-hero/points/:index', protect, authorize('admin'), updateServiceHeroPoint);
router.delete('/service-hero/points/:index', protect, authorize('admin'), deleteServiceHeroPoint);
router.delete('/service-hero', protect, authorize('admin'), deleteServiceHero);

// ==================== SERVICE CATALOGUE CRUD (ADMIN ONLY) ====================
router.post('/service-catalogue', protect, authorize('admin'), createServiceCatalogue);
router.put('/service-catalogue', protect, authorize('admin'), updateServiceCatalogue);
router.get('/service-catalogue', protect, authorize('admin'), getServiceCatalogue);
router.post('/service-catalogue/cards', protect, authorize('admin'), addCatalogueCard);
router.get('/service-catalogue/cards', protect, authorize('admin'), getAllCatalogueCards);
router.get('/service-catalogue/cards/:index', protect, authorize('admin'), getCatalogueCardById);
router.put('/service-catalogue/cards/:index', protect, authorize('admin'), updateCatalogueCard);
router.delete('/service-catalogue/cards/:index', protect, authorize('admin'), deleteCatalogueCard);
router.delete('/service-catalogue', protect, authorize('admin'), deleteServiceCatalogue);

// ==================== SERVICE SUPPORT CRUD (ADMIN ONLY) ====================
router.post('/service-support', protect, authorize('admin'), createServiceSupport);
router.put('/service-support', protect, authorize('admin'), updateServiceSupport);
router.get('/service-support', protect, authorize('admin'), getServiceSupport);
router.post('/service-support/points', protect, authorize('admin'), addServiceSupportPoint);
router.put('/service-support/points/:index', protect, authorize('admin'), updateServiceSupportPoint);
router.delete('/service-support/points/:index', protect, authorize('admin'), deleteServiceSupportPoint);
router.delete('/service-support', protect, authorize('admin'), deleteServiceSupport);

// ==================== SERVICE REQUESTS (ADMIN ONLY) ====================
router.get('/admin', protect, authorize('admin'), getAllServiceRequests);
router.get('/admin/stats', protect, authorize('admin'), getServiceStats);
router.get('/admin/status/:status', protect, authorize('admin'), getServiceRequestsByStatus);
router.get('/admin/:id', protect, authorize('admin'), getServiceRequestById);
router.put('/admin/:id/status', protect, authorize('admin'), updateServiceStatus);
router.put('/admin/:id', protect, authorize('admin'), updateServiceRequest);
router.delete('/admin/:id', protect, authorize('admin'), deleteServiceRequest);
router.delete('/admin/:id/permanent', protect, authorize('admin'), permanentDeleteServiceRequest);

export default router;