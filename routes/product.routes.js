import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductsByBrand,
  getProductsByCategory
} from '../controllers/product.controller.js';
import { uploadProductImages } from '../config/multer.config.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/brand/:brandId', getProductsByBrand);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id', getProductById);

// Admin only routes
router.post('/', protect, authorize('admin'), uploadProductImages, createProduct);
router.put('/:id', protect, authorize('admin'), uploadProductImages, updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

export default router;