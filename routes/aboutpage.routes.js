import express from 'express';
import multer from 'multer';
import {
  getAboutPage,
  createAboutPage,
  updateAboutPage,
  deleteAboutPage,
  updateHero, getHero, deleteHero,
  updateAbout, getAbout, deleteAbout,
  addCard, getAllCards, getCardById, updateCard, deleteCard,
  updateCoreValues, getCoreValues, addCoreValue, getCoreValueById, updateCoreValue, deleteCoreValue,
  updateWhyChooseUs, getWhyChooseUs, addWhyChoosePoint, getWhyChoosePointById, updateWhyChoosePoint, deleteWhyChoosePoint,
  updateCta, getCta, deleteCta
} from '../controllers/aboutPage.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// ==================== PUBLIC ====================
router.get('/', getAboutPage);

// ==================== FULL PAGE CRUD ====================
router.post('/', protect, authorize('admin'), createAboutPage);
router.put('/', protect, authorize('admin'), updateAboutPage);
router.delete('/', protect, authorize('admin'), deleteAboutPage);

// ==================== HERO CRUD ====================
router.put('/hero', protect, authorize('admin'), upload.single('image'), updateHero);
router.get('/hero', protect, authorize('admin'), getHero);
router.delete('/hero', protect, authorize('admin'), deleteHero);

// ==================== ABOUT CRUD ====================
router.put('/about', protect, authorize('admin'), upload.single('bgImage'), updateAbout);
router.get('/about', protect, authorize('admin'), getAbout);
router.delete('/about', protect, authorize('admin'), deleteAbout);

// ==================== CARDS CRUD ====================
router.post('/cards', protect, authorize('admin'), upload.single('image'), addCard);
router.get('/cards', protect, authorize('admin'), getAllCards);
router.get('/cards/:index', protect, authorize('admin'), getCardById);
router.put('/cards/:index', protect, authorize('admin'), upload.single('image'), updateCard);
router.delete('/cards/:index', protect, authorize('admin'), deleteCard);

// ==================== CORE VALUES CRUD ====================
router.put('/core-values', protect, authorize('admin'), updateCoreValues);
router.get('/core-values', protect, authorize('admin'), getCoreValues);
router.post('/core-values', protect, authorize('admin'), addCoreValue);
router.get('/core-values/:index', protect, authorize('admin'), getCoreValueById);
router.put('/core-values/:index', protect, authorize('admin'), updateCoreValue);
router.delete('/core-values/:index', protect, authorize('admin'), deleteCoreValue);

// ==================== WHY CHOOSE US CRUD ====================
router.put('/why-choose-us', protect, authorize('admin'), upload.single('image'), updateWhyChooseUs);
router.get('/why-choose-us', protect, authorize('admin'), getWhyChooseUs);
router.post('/why-choose-us/points', protect, authorize('admin'), addWhyChoosePoint);
router.get('/why-choose-us/points/:index', protect, authorize('admin'), getWhyChoosePointById);
router.put('/why-choose-us/points/:index', protect, authorize('admin'), updateWhyChoosePoint);
router.delete('/why-choose-us/points/:index', protect, authorize('admin'), deleteWhyChoosePoint);

// ==================== CTA CRUD ====================
router.put('/cta', protect, authorize('admin'), updateCta);
router.get('/cta', protect, authorize('admin'), getCta);
router.delete('/cta', protect, authorize('admin'), deleteCta);

export default router;