import express from 'express';
import multer from 'multer';
import {
  getBlogsPage,
  createBlogHero,
  updateBlogHero,
  getBlogHero,
  deleteBlogHero,
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  getBlogById,
  updateBlog,
  deleteBlog,
  getFeaturedBlogs,
  getAllCategories,
  getAllTags
} from '../controllers/blogspage.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// ==================== PUBLIC ROUTES ====================
router.get('/', getBlogsPage);
router.get('/all', getAllBlogs);
router.get('/categories', getAllCategories);
router.get('/tags', getAllTags);
router.get('/featured', getFeaturedBlogs);
router.get('/slug/:slug', getBlogBySlug);
router.get('/:id', getBlogById);

// ==================== BLOG HERO (ADMIN) ====================
router.post('/hero', upload.single('image'), createBlogHero);
router.put('/hero', upload.single('image'), updateBlogHero);
router.get('/hero', getBlogHero);
router.delete('/hero', deleteBlogHero);

// ==================== BLOGS (ADMIN) ====================
router.post('/', upload.fields([
  { name: 'bgImage', maxCount: 1 },
  { name: 'mainImage', maxCount: 1 },
  { name: 'authorImage', maxCount: 1 }
]), createBlog);
router.put('/:id', upload.fields([
  { name: 'bgImage', maxCount: 1 },
  { name: 'mainImage', maxCount: 1 },
  { name: 'authorImage', maxCount: 1 }
]), updateBlog);
router.delete('/:id', deleteBlog);

export default router;