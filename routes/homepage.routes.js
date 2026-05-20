import express from 'express';
import multer from 'multer';
import {
  getHomePage,
  addHero,
  getAllHero,
  getHeroById,
  updateHero,
  deleteHero,
  createAbout, getAbout, updateAbout, deleteAbout,
  addAboutPoint, updateAboutPoint, deleteAboutPoint,
  createAchievements, getAchievements, updateAchievements, deleteAchievements,
  addAchievementImage, updateAchievementImage, deleteAchievementImage,
  createTestimonials, getTestimonials, updateTestimonials, deleteTestimonials,
  addTestimonial, updateTestimonial, deleteTestimonial
} from '../controllers/homepage.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// ==================== PUBLIC ====================
router.get('/', getHomePage);

// ==================== HERO SECTION CRUD (ADMIN ONLY) ====================
router.post('/hero', protect, authorize('admin'), upload.single('image'), addHero);
router.get('/hero', protect, authorize('admin'), getAllHero);
router.get('/hero/:index', protect, authorize('admin'), getHeroById);
router.put('/hero/:index', protect, authorize('admin'), upload.single('image'), updateHero);
router.delete('/hero/:index', protect, authorize('admin'), deleteHero);

// ==================== ABOUT SECTION CRUD (ADMIN ONLY) ====================
router.post('/about', protect, authorize('admin'), upload.single('image'), createAbout);
router.get('/about', protect, authorize('admin'), getAbout);
router.put('/about', protect, authorize('admin'), upload.single('image'), updateAbout);
router.delete('/about', protect, authorize('admin'), deleteAbout);

// About Points CRUD (ADMIN ONLY)
router.post('/about/points', protect, authorize('admin'), addAboutPoint);
router.put('/about/points/:index', protect, authorize('admin'), updateAboutPoint);
router.delete('/about/points/:index', protect, authorize('admin'), deleteAboutPoint);

// ==================== ACHIEVEMENTS SECTION CRUD (ADMIN ONLY) ====================
router.post('/achievements', protect, authorize('admin'), upload.array('images', 20), createAchievements);
router.get('/achievements', protect, authorize('admin'), getAchievements);
router.put('/achievements', protect, authorize('admin'), upload.array('images', 20), updateAchievements);
router.delete('/achievements', protect, authorize('admin'), deleteAchievements);

// Achievement Images CRUD (ADMIN ONLY)
router.post('/achievements/images', protect, authorize('admin'), upload.single('image'), addAchievementImage);
router.put('/achievements/images/:index', protect, authorize('admin'), upload.single('image'), updateAchievementImage);
router.delete('/achievements/images/:index', protect, authorize('admin'), deleteAchievementImage);

// ==================== TESTIMONIALS SECTION CRUD (ADMIN ONLY) ====================
router.post('/testimonials', protect, authorize('admin'), createTestimonials);
router.get('/testimonials', protect, authorize('admin'), getTestimonials);
router.put('/testimonials', protect, authorize('admin'), updateTestimonials);
router.delete('/testimonials', protect, authorize('admin'), deleteTestimonials);

// Testimonial Items CRUD (ADMIN ONLY)
router.post('/testimonials/add', protect, authorize('admin'), upload.single('image'), addTestimonial);
router.put('/testimonials/:index', protect, authorize('admin'), upload.single('image'), updateTestimonial);
router.delete('/testimonials/:index', protect, authorize('admin'), deleteTestimonial);

export default router;