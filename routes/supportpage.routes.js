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

// ==================== FULL PAGE CRUD ====================
router.post('/', createSupportPage);
router.put('/', updateSupportPage);
router.delete('/', deleteSupportPage);

// ==================== SUPPORT HERO CRUD ====================
router.post('/hero', upload.single('image'), createSupportHero);
router.put('/hero', upload.single('image'), updateSupportHero);
router.get('/hero', getSupportHero);
router.delete('/hero', deleteSupportHero);

// ==================== SUPPORT CARDS CRUD (Array) ====================
router.post('/cards', addSupportCard);
router.get('/cards', getAllSupportCards);
router.get('/cards/:index', getSupportCardById);
router.put('/cards/:index', updateSupportCard);
router.delete('/cards/:index', deleteSupportCard);

// ==================== SUPPORT SOLUTIONS CRUD ====================
router.post('/solutions', createSupportSolutions);
router.put('/solutions', updateSupportSolutions);
router.get('/solutions', getSupportSolutions);
router.post('/solutions/cards', addSolutionCard);
router.put('/solutions/cards/:index', updateSolutionCard);
router.delete('/solutions/cards/:index', deleteSolutionCard);
router.delete('/solutions', deleteSupportSolutions);

// ==================== SUPPORT LIFE CYCLE CRUD ====================
router.post('/life-cycle', createSupportLifeCycle);
router.put('/life-cycle', updateSupportLifeCycle);
router.get('/life-cycle', getSupportLifeCycle);
router.post('/life-cycle/points', addLifeCyclePoint);
router.put('/life-cycle/points/:index', updateLifeCyclePoint);
router.delete('/life-cycle/points/:index', deleteLifeCyclePoint);
router.delete('/life-cycle', deleteSupportLifeCycle);

// ==================== SUPPORT FAQ CRUD ====================
router.post('/faq', createSupportFaq);
router.put('/faq', updateSupportFaq);
router.get('/faq', getSupportFaq);
router.post('/faq/add', addFaq);
router.put('/faq/:index', updateFaq);
router.delete('/faq/:index', deleteFaq);
router.delete('/faq', deleteSupportFaq);

// ==================== SUPPORT CTA CRUD ====================
router.post('/cta', createSupportCta);
router.put('/cta', updateSupportCta);
router.get('/cta', getSupportCta);
router.delete('/cta', deleteSupportCta);

export default router;