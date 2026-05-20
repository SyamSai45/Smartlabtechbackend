import express from 'express';
import multer from 'multer';
import {
  getResourcePage,
  createResourcePage,
  updateResourcePage,
  deleteResourcePage,
  createHero,
  updateHero,
  getHero,
  deleteHero,
  updateArticlesSection,
  getArticlesSection,
  addArticle,
  updateArticle,
  deleteArticle,
  updatePdfsSection,
  getPdfsSection,
  addPdf,
  deletePdf,
  updateCaseStudiesSection,
  getCaseStudiesSection,
  addCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
  updateFaqsSection,
  getFaqsSection,
  addFaq,
  updateFaq,
  deleteFaq,
  updateAchievementsSection,
  getAchievementsSection,
  addAchievement,
  updateAchievement,
  deleteAchievement,
  updateCtaSection,
  getCtaSection,
  deleteCtaSection
} from '../controllers/resourcePage.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// ==================== PUBLIC ROUTES ====================
router.get('/', getResourcePage);

// ==================== FULL PAGE CRUD (ADMIN) ====================
router.post('/', protect, authorize('admin'), createResourcePage);
router.put('/', protect, authorize('admin'), updateResourcePage);
router.delete('/', protect, authorize('admin'), deleteResourcePage);

// ==================== HERO CRUD (ADMIN) ====================
router.post('/hero', protect, authorize('admin'), upload.single('image'), createHero);
router.put('/hero', protect, authorize('admin'), upload.single('image'), updateHero);
router.get('/hero', getHero);
router.delete('/hero', protect, authorize('admin'), deleteHero);

// ==================== ARTICLES CRUD (ADMIN) ====================
router.put('/articles', protect, authorize('admin'), updateArticlesSection);
router.get('/articles', getArticlesSection);
router.post('/articles/add', protect, authorize('admin'), upload.single('image'), addArticle);
router.put('/articles/:index', protect, authorize('admin'), upload.single('image'), updateArticle);
router.delete('/articles/:index', protect, authorize('admin'), deleteArticle);

// ==================== PDFs CRUD (ADMIN) ====================
router.put('/pdfs', protect, authorize('admin'), updatePdfsSection);
router.get('/pdfs', getPdfsSection);
router.post('/pdfs/add', protect, authorize('admin'), upload.single('file'), addPdf);
router.delete('/pdfs/:index', protect, authorize('admin'), deletePdf);

// ==================== CASE STUDIES CRUD (ADMIN) ====================
router.put('/case-studies', protect, authorize('admin'), updateCaseStudiesSection);
router.get('/case-studies', getCaseStudiesSection);
router.post('/case-studies/add', protect, authorize('admin'), upload.single('image'), addCaseStudy);
router.put('/case-studies/:index', protect, authorize('admin'), upload.single('image'), updateCaseStudy);
router.delete('/case-studies/:index', protect, authorize('admin'), deleteCaseStudy);

// ==================== FAQS CRUD (ADMIN) ====================
router.put('/faqs', protect, authorize('admin'), updateFaqsSection);
router.get('/faqs', getFaqsSection);
router.post('/faqs/add', protect, authorize('admin'), addFaq);
router.put('/faqs/:index', protect, authorize('admin'), updateFaq);
router.delete('/faqs/:index', protect, authorize('admin'), deleteFaq);

// ==================== ACHIEVEMENTS CRUD (ADMIN) ====================
router.put('/achievements', protect, authorize('admin'), updateAchievementsSection);
router.get('/achievements', getAchievementsSection);
router.post('/achievements/add', protect, authorize('admin'), addAchievement);
router.put('/achievements/:index', protect, authorize('admin'), updateAchievement);
router.delete('/achievements/:index', protect, authorize('admin'), deleteAchievement);

// ==================== CTA CRUD (ADMIN) ====================
router.put('/cta', protect, authorize('admin'), updateCtaSection);
router.get('/cta', getCtaSection);
router.delete('/cta', protect, authorize('admin'), deleteCtaSection);

export default router;