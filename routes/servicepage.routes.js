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
  deleteServiceSupport
} from '../controllers/servicePage.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// ==================== PUBLIC ====================
router.get('/', getServicesPage);

// ==================== FULL PAGE CRUD ====================
router.post('/', createServicesPage);
router.put('/', updateServicesPage);
router.delete('/', deleteServicesPage);

// ==================== SERVICE HOME CRUD ====================
router.post('/service-home', upload.single('image'), createServiceHome);
router.put('/service-home', upload.single('image'), updateServiceHome);
router.get('/service-home', getServiceHome);
router.delete('/service-home', deleteServiceHome);

// ==================== SERVICE HERO CRUD ====================
router.post('/service-hero', createServiceHero);
router.put('/service-hero', updateServiceHero);
router.get('/service-hero', getServiceHero);
router.post('/service-hero/points', addServiceHeroPoint);
router.put('/service-hero/points/:index', updateServiceHeroPoint);
router.delete('/service-hero/points/:index', deleteServiceHeroPoint);
router.delete('/service-hero', deleteServiceHero);

// ==================== SERVICE CATALOGUE CRUD ====================
router.post('/service-catalogue', createServiceCatalogue);
router.put('/service-catalogue', updateServiceCatalogue);
router.get('/service-catalogue', getServiceCatalogue);
router.post('/service-catalogue/cards', addCatalogueCard);
router.get('/service-catalogue/cards', getAllCatalogueCards);
router.get('/service-catalogue/cards/:index', getCatalogueCardById);
router.put('/service-catalogue/cards/:index', updateCatalogueCard);
router.delete('/service-catalogue/cards/:index', deleteCatalogueCard);
router.delete('/service-catalogue', deleteServiceCatalogue);

// ==================== SERVICE SUPPORT CRUD ====================
router.post('/service-support', createServiceSupport);
router.put('/service-support', updateServiceSupport);
router.get('/service-support', getServiceSupport);
router.post('/service-support/points', addServiceSupportPoint);
router.put('/service-support/points/:index', updateServiceSupportPoint);
router.delete('/service-support/points/:index', deleteServiceSupportPoint);
router.delete('/service-support', deleteServiceSupport);

export default router;