import express from 'express';
import multer from 'multer';
import {
  // Full Page
  getAboutPage,
  createAboutPage,
  updateAboutPage,
  deleteAboutPage,
  // Hero
  createHero,
  updateHero,
  getHero,
  deleteHero,
  // About Section
  createAbout,
  updateAbout,
  getAbout,
  deleteAbout,
  // Cards
  addCard,
  getAllCards,
  deleteCard,
  // Core Values
  addCoreValue,
  deleteCoreValue,
  // Why Choose Us
  addWhyChoosePoint,
  deleteWhyChoosePoint,
  // CTA
  createCta,
  updateCta,
  getCta,
  deleteCta
} from '../controllers/aboutpage.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// ==================== PUBLIC ====================
router.get('/', getAboutPage);

// ==================== FULL PAGE (ADMIN) ====================
router.post('/', protect, authorize('admin'), createAboutPage);
router.put('/', protect, authorize('admin'), updateAboutPage);
router.delete('/', protect, authorize('admin'), deleteAboutPage);

// ==================== HERO (ADMIN) ====================
router.post('/hero', protect, authorize('admin'), upload.single('image'), createHero);
router.put('/hero', protect, authorize('admin'), upload.single('image'), updateHero);
router.get('/hero', getHero);
router.delete('/hero', protect, authorize('admin'), deleteHero);

// ==================== ABOUT SECTION (ADMIN) ====================
router.post('/about', protect, authorize('admin'), upload.single('bgImage'), createAbout);
router.put('/about', protect, authorize('admin'), upload.single('bgImage'), updateAbout);
router.get('/about', getAbout);
router.delete('/about', protect, authorize('admin'), deleteAbout);

// ==================== CARDS (ADMIN) ====================
router.post('/cards', protect, authorize('admin'), upload.single('image'), addCard);
router.get('/cards', getAllCards);
router.delete('/cards/:index', protect, authorize('admin'), deleteCard);

// ==================== CORE VALUES (ADMIN) ====================
router.post('/core-values', protect, authorize('admin'), addCoreValue);
router.delete('/core-values/:index', protect, authorize('admin'), deleteCoreValue);

// ==================== WHY CHOOSE US (ADMIN) ====================
router.post('/why-choose-us/points', protect, authorize('admin'), addWhyChoosePoint);
router.delete('/why-choose-us/points/:index', protect, authorize('admin'), deleteWhyChoosePoint);

// ==================== CTA (ADMIN) ====================
router.post('/cta', protect, authorize('admin'), createCta);
router.put('/cta', protect, authorize('admin'), updateCta);
router.get('/cta', getCta);
router.delete('/cta', protect, authorize('admin'), deleteCta);  

export default router;