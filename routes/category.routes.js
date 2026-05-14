import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryOptions,
  getCategoriesWithProducts,
  getCategoryWithProducts
} from '../controllers/category.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/options', getCategoryOptions);
router.get('/with-products', getCategoriesWithProducts);
router.get('/:id/with-products', getCategoryWithProducts);
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Admin only routes
router.post('/',  createCategory);
router.put('/:id',  updateCategory);
router.delete('/:id',  deleteCategory);

export default router;