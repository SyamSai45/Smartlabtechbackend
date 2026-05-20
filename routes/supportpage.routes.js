import express from 'express';
import multer from 'multer';
import {
  getSupportPage,
  createSupportPage,
  updateSupportPage,
  deleteSupportPage,
  createSupportHero,
  updateSupportHero,
  getSupportHero,
  deleteSupportHero,
  addSupportCard,
  getAllSupportCards,
  getSupportCardById,
  updateSupportCard,
  deleteSupportCard,
  createSupportSolutions,
  updateSupportSolutions,
  getSupportSolutions,
  addSolutionCard,
  updateSolutionCard,
  deleteSolutionCard,
  deleteSupportSolutions,
  createSupportLifeCycle,
  updateSupportLifeCycle,
  getSupportLifeCycle,
  addLifeCyclePoint,
  updateLifeCyclePoint,
  deleteLifeCyclePoint,
  deleteSupportLifeCycle,
  createSupportFaq,
  updateSupportFaq,
  getSupportFaq,
  addFaq,
  updateFaq,
  deleteFaq,
  deleteSupportFaq,
  createSupportCta,
  updateSupportCta,
  getSupportCta,
  deleteSupportCta
} from '../controllers/supportpage.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// ==================== PUBLIC ====================
router.get('/', getSupportPage);

// ==================== FULL PAGE CRUD (ADMIN ONLY) ====================
router.post('/', protect, authorize('admin'), createSupportPage);
router.put('/', protect, authorize('admin'), updateSupportPage);
router.delete('/', protect, authorize('admin'), deleteSupportPage);

// ==================== SUPPORT HERO CRUD (ADMIN ONLY) ====================
router.post('/hero', protect, authorize('admin'), upload.single('image'), createSupportHero);
router.put('/hero', protect, authorize('admin'), upload.single('image'), updateSupportHero);
router.get('/hero', protect, authorize('admin'), getSupportHero);
router.delete('/hero', protect, authorize('admin'), deleteSupportHero);

// ==================== SUPPORT CARDS CRUD (ADMIN ONLY) ====================
router.post('/cards', protect, authorize('admin'), addSupportCard);
router.get('/cards', protect, authorize('admin'), getAllSupportCards);
router.get('/cards/:index', protect, authorize('admin'), getSupportCardById);
router.put('/cards/:index', protect, authorize('admin'), updateSupportCard);
router.delete('/cards/:index', protect, authorize('admin'), deleteSupportCard);

// ==================== SUPPORT SOLUTIONS CRUD (ADMIN ONLY) ====================
router.post('/solutions', protect, authorize('admin'), createSupportSolutions);
router.put('/solutions', protect, authorize('admin'), updateSupportSolutions);
router.get('/solutions', protect, authorize('admin'), getSupportSolutions);
router.post('/solutions/cards', protect, authorize('admin'), addSolutionCard);
router.put('/solutions/cards/:index', protect, authorize('admin'), updateSolutionCard);
router.delete('/solutions/cards/:index', protect, authorize('admin'), deleteSolutionCard);
router.delete('/solutions', protect, authorize('admin'), deleteSupportSolutions);

// ==================== SUPPORT LIFE CYCLE CRUD (ADMIN ONLY) ====================
router.post('/life-cycle', protect, authorize('admin'), createSupportLifeCycle);
router.put('/life-cycle', protect, authorize('admin'), updateSupportLifeCycle);
router.get('/life-cycle', protect, authorize('admin'), getSupportLifeCycle);
router.post('/life-cycle/points', protect, authorize('admin'), addLifeCyclePoint);
router.put('/life-cycle/points/:index', protect, authorize('admin'), updateLifeCyclePoint);
router.delete('/life-cycle/points/:index', protect, authorize('admin'), deleteLifeCyclePoint);
router.delete('/life-cycle', protect, authorize('admin'), deleteSupportLifeCycle);

// ==================== SUPPORT FAQ CRUD (ADMIN ONLY) ====================
router.post('/faq', protect, authorize('admin'), createSupportFaq);
router.put('/faq', protect, authorize('admin'), updateSupportFaq);
router.get('/faq', protect, authorize('admin'), getSupportFaq);
router.post('/faq/add', protect, authorize('admin'), addFaq);
router.put('/faq/:index', protect, authorize('admin'), updateFaq);
router.delete('/faq/:index', protect, authorize('admin'), deleteFaq);
router.delete('/faq', protect, authorize('admin'), deleteSupportFaq);

// ==================== SUPPORT CTA CRUD (ADMIN ONLY) ====================
router.post('/cta', protect, authorize('admin'), createSupportCta);
router.put('/cta', protect, authorize('admin'), updateSupportCta);
router.get('/cta', protect, authorize('admin'), getSupportCta);
router.delete('/cta', protect, authorize('admin'), deleteSupportCta);

export default router;