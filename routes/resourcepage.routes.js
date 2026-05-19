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
router.post('/', createResourcePage);
router.put('/', updateResourcePage);
router.delete('/', deleteResourcePage);

// ==================== HERO CRUD (ADMIN) ====================
router.post('/hero', upload.single('image'), createHero);
router.put('/hero', upload.single('image'), updateHero);
router.get('/hero', getHero);
router.delete('/hero', deleteHero);

// ==================== ARTICLES CRUD (ADMIN) ====================
router.put('/articles', updateArticlesSection);
router.get('/articles', getArticlesSection);
router.post('/articles/add', upload.single('image'), addArticle);
router.put('/articles/:index', upload.single('image'), updateArticle);
router.delete('/articles/:index', deleteArticle);

// ==================== PDFs CRUD (ADMIN) ====================
router.put('/pdfs', updatePdfsSection);
router.get('/pdfs', getPdfsSection);
router.post('/pdfs/add', upload.single('file'), addPdf);
router.delete('/pdfs/:index', deletePdf);

// ==================== CASE STUDIES CRUD (ADMIN) ====================
router.put('/case-studies', updateCaseStudiesSection);
router.get('/case-studies', getCaseStudiesSection);
router.post('/case-studies/add', upload.single('image'), addCaseStudy);
router.put('/case-studies/:index', upload.single('image'), updateCaseStudy);
router.delete('/case-studies/:index', deleteCaseStudy);

// ==================== FAQS CRUD (ADMIN) ====================
router.put('/faqs', updateFaqsSection);
router.get('/faqs', getFaqsSection);
router.post('/faqs/add', addFaq);
router.put('/faqs/:index', updateFaq);
router.delete('/faqs/:index', deleteFaq);

// ==================== ACHIEVEMENTS CRUD (ADMIN) ====================
router.put('/achievements', updateAchievementsSection);
router.get('/achievements', getAchievementsSection);
router.post('/achievements/add', addAchievement);
router.put('/achievements/:index', updateAchievement);
router.delete('/achievements/:index', deleteAchievement);

// ==================== CTA CRUD (ADMIN) ====================
router.put('/cta', updateCtaSection);
router.get('/cta', getCtaSection);
router.delete('/cta', deleteCtaSection);

export default router;