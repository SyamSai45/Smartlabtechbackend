import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySlug,
  getProductByName,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductsByBrand,
  getProductsByCategory
} from '../controllers/product.controller.js';
import { uploadProductImages } from '../config/multer.config.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// IMPORTANT: Specific routes MUST come before parameterized routes
// Public routes - specific paths first
router.get('/featured', getFeaturedProducts);
router.get('/brand/:brandId', getProductsByBrand);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/slug/:slug', getProductBySlug);  // Slug route
router.get('/name/:name', getProductByName);  // Name route
router.get('/', getAllProducts);  // This should be before /:id

// This must be LAST - catches any ID that doesn't match above patterns
router.get('/:id', getProductById);

// Admin only routes
router.post('/', uploadProductImages, createProduct);
router.put('/:id', uploadProductImages, updateProduct);
router.delete('/:id', deleteProduct);

export default router;