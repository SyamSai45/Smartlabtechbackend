import express from 'express';
import {
  createProduct, getAllProducts, getProductById, getProductBySlug, getProductByName,
  getFeaturedProducts, getProductsByBrand, getProductsByCategory, updateProduct, deleteProduct,
  toggleProductStatus, searchProducts, getSearchFilters,
  getProductSuggestions, addProductSuggestion, removeProductSuggestion, toggleSuggestionStatus,getAllProductsAdmin, bulkAddProductSuggestions
} from '../controllers/product.controller.js';
import { uploadProductImages } from '../config/multer.config.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/admin', getAllProductsAdmin);
router.get('/search', searchProducts);
router.get('/search/filters', getSearchFilters);
router.get('/featured', getFeaturedProducts);
router.get('/suggestions', getProductSuggestions);
router.get('/slug/:slug', getProductBySlug);
router.get('/name/:name', getProductByName);
router.get('/brand/:brandId', getProductsByBrand);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id', getProductById);

// Admin routes
router.post('/', protect, authorize('admin'), uploadProductImages, createProduct);
router.put('/:id', protect, authorize('admin'), uploadProductImages, updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.patch('/:id/toggle', protect, authorize('admin'), toggleProductStatus);

// Suggestions routes (Admin)
router.post('/suggestions', protect, authorize('admin'), addProductSuggestion);
router.post('/suggestions/bulk', protect, authorize('admin'), bulkAddProductSuggestions);
router.delete('/suggestions/:productId', protect, authorize('admin'), removeProductSuggestion);
router.patch('/suggestions/:productId/toggle', protect, authorize('admin'), toggleSuggestionStatus);

export default router;