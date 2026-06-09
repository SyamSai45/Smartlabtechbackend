// routes/applicationPageRoutes.js
import express from 'express';
import {
  // Hero
  createHero,
  getAllHero,
  getHeroById,
  updateHero,
  deleteHero,
  // Main Cards
  createMainCard,
  getAllMainCards,
  getMainCardById,
  updateMainCard,
  deleteMainCard,
  // Services
  createServices,
  getAllServices,
  getServicesById,
  updateServices,
  deleteServices,
  // Service Cards
  addServiceCard,
  updateServiceCard,
  deleteServiceCard,
  // CTA
  createCTA,
  getAllCTA,
  getCTAById,
  updateCTA,
  deleteCTA
} from '../controllers/ApplicationPage.controller.js';
import { uploadHeroImage } from '../config/multer.config.js';

const router = express.Router();

// ==================== HERO ROUTES (with image upload) ====================
router.post('/hero', uploadHeroImage, createHero);
router.get('/hero', getAllHero);
router.get('/hero/:id', getHeroById);
router.put('/hero/:id', uploadHeroImage, updateHero);
router.delete('/hero/:id', deleteHero);

// ==================== MAIN CARDS ROUTES ====================
router.post('/main-cards', createMainCard);
router.get('/main-cards', getAllMainCards);
router.get('/main-cards/:id', getMainCardById);
router.put('/main-cards/:id', updateMainCard);
router.delete('/main-cards/:id', deleteMainCard);

// ==================== SERVICES ROUTES ====================
router.post('/services', createServices);
router.get('/services', getAllServices);
router.get('/services/:id', getServicesById);
router.put('/services/:id', updateServices);
router.delete('/services/:id', deleteServices);

// ==================== SERVICE CARDS ROUTES ====================
router.post('/services/:servicesId/cards', addServiceCard);
router.put('/services/:servicesId/cards/:cardId', updateServiceCard);
router.delete('/services/:servicesId/cards/:cardId', deleteServiceCard);

// ==================== CTA ROUTES ====================
router.post('/cta', createCTA);
router.get('/cta', getAllCTA);
router.get('/cta/:id', getCTAById);
router.put('/cta/:id', updateCTA);
router.delete('/cta/:id', deleteCTA);

export default router;