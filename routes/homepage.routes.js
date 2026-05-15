import express from 'express';
import multer from 'multer';
import {
  getHomePage,
  createHero, getHero, updateHero, deleteHero,
  createAbout, getAbout, updateAbout, deleteAbout,
  addAboutPoint, updateAboutPoint, deleteAboutPoint,
  createAchievements, getAchievements, updateAchievements, deleteAchievements,
  addAchievementImage, updateAchievementImage, deleteAchievementImage,
  createTestimonials, getTestimonials, updateTestimonials, deleteTestimonials,
  addTestimonial, updateTestimonial, deleteTestimonial
} from '../controllers/homePage.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// ==================== PUBLIC ====================
router.get('/', getHomePage);

// ==================== HERO SECTION CRUD ====================
router.post('/hero', upload.single('image'), createHero);
router.get('/hero', getHero);
router.put('/hero', upload.single('image'), updateHero);
router.delete('/hero', deleteHero);

// ==================== ABOUT SECTION CRUD ====================
router.post('/about', upload.single('image'), createAbout);
router.get('/about', getAbout);
router.put('/about', upload.single('image'), updateAbout);
router.delete('/about', deleteAbout);

// About Points CRUD
router.post('/about/points', addAboutPoint);
router.put('/about/points/:index', updateAboutPoint);
router.delete('/about/points/:index', deleteAboutPoint);

// ==================== ACHIEVEMENTS SECTION CRUD ====================
router.post('/achievements', upload.array('images', 20), createAchievements);
router.get('/achievements', getAchievements);
router.put('/achievements', upload.array('images', 20), updateAchievements);
router.delete('/achievements', deleteAchievements);

// Achievement Images CRUD
router.post('/achievements/images', upload.single('image'), addAchievementImage);
router.put('/achievements/images/:index', upload.single('image'), updateAchievementImage);
router.delete('/achievements/images/:index', deleteAchievementImage);

// ==================== TESTIMONIALS SECTION CRUD ====================
router.post('/testimonials', createTestimonials);
router.get('/testimonials', getTestimonials);
router.put('/testimonials', updateTestimonials);
router.delete('/testimonials', deleteTestimonials);

// Testimonial Items CRUD
router.post('/testimonials/add', upload.single('image'), addTestimonial);
router.put('/testimonials/:index', upload.single('image'), updateTestimonial);
router.delete('/testimonials/:index', deleteTestimonial);

export default router;