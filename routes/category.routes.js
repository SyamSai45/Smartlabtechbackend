import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  getCategoryOptions,
  getCategoriesWithProducts,
  getCategoryWithProducts,
  getCategoryBySlugWithProducts
} from '../controllers/category.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// IMPORTANT: Specific routes MUST come before parameterized routes
// Public routes - specific paths first
router.get('/options', getCategoryOptions);
router.get('/with-products', getCategoriesWithProducts);  // This must come BEFORE /:id and /:slug

// Parameterized routes - these come AFTER specific routes
router.get('/slug/:slug/with-products', getCategoryBySlugWithProducts);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id/with-products', getCategoryWithProducts);
router.get('/:id', getCategoryById);
router.get('/', getAllCategories);  // This should be last

// Admin only routes
router.post('/',  createCategory);
router.put('/:id',  updateCategory);
router.delete('/:id', deleteCategory);

export default router;