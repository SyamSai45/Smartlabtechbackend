import express from 'express';
import {
  createBrand,
  getAllBrands,
  getBrandById,
  getBrandBySlug,
  updateBrand,
  deleteBrand,
  getBrandOptions
} from '../controllers/brand.controller.js';
import { uploadBrandLogo } from '../config/multer.config.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllBrands);
router.get('/options', getBrandOptions);
router.get('/slug/:slug', getBrandBySlug);
router.get('/:id', getBrandById);

// Admin only routes
router.post('/', protect, authorize('admin'), uploadBrandLogo, createBrand);
router.put('/:id', protect, authorize('admin'), uploadBrandLogo, updateBrand);
router.delete('/:id', protect, authorize('admin'), deleteBrand);

export default router;