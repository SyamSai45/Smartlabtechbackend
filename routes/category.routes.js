import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  getCategoryOptions,
  toggleCategoryStatus
} from '../controllers/category.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAllCategories);
router.get('/options', getCategoryOptions);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategoryById);

// Admin only routes (require authentication and admin role)
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.patch('/:id/toggle', toggleCategoryStatus);
router.delete('/:id', deleteCategory);

export default router;