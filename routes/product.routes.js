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
  toggleProductStatus
} from '../controllers/product.controller.js';
import { uploadProductImages } from '../config/multer.config.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/featured', getFeaturedProducts);
router.get('/brand/:brandId', getProductsByBrand);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/name/:name', getProductByName);
router.get('/slug/:slug', getProductBySlug);   
router.get('/', getAllProducts);
router.get('/:id', getProductById);            

router.post('/', uploadProductImages, createProduct);
router.put('/:id', uploadProductImages, updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/toggle', toggleProductStatus);

export default router;