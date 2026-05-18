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
  getProductsByCategory,
  toggleProductStatus,
  searchProducts,
  getSearchFilters,
  addProductSuggestion,
  getProductSuggestions,
  removeProductSuggestion,
  toggleSuggestionStatus,
  bulkAddProductSuggestions
} from '../controllers/product.controller.js';
import { uploadProductImages } from '../config/multer.config.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// ==================== SEARCH ROUTES (MUST COME FIRST) ====================
router.get('/search', searchProducts);
router.get('/search/filters', getSearchFilters);

router.get('/suggestions', getProductSuggestions);
router.get('/suggestions/admin', getProductSuggestions);
router.post('/suggestions', addProductSuggestion);
router.post('/suggestions/bulk', bulkAddProductSuggestions);
router.patch('/suggestions/:productId/toggle', toggleSuggestionStatus);
router.delete('/suggestions/:productId', removeProductSuggestion);

// ==================== OTHER PUBLIC ROUTES ====================
router.get('/featured', getFeaturedProducts);
router.get('/brand/:brandId', getProductsByBrand);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/name/:name', getProductByName);
router.get('/slug/:slug', getProductBySlug);
router.get('/', getAllProducts);

// ==================== ID ROUTE (MUST COME LAST) ====================
router.get('/:id', getProductById);

// ==================== ADMIN ROUTES ====================
router.post('/', uploadProductImages, createProduct);
router.put('/:id', uploadProductImages, updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/toggle', toggleProductStatus);

export default router;