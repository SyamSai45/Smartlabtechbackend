import express from 'express';
import {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
  getBrandOptions
} from '../controllers/brand.controller.js';
import { uploadBrandLogo } from '../config/multer.config.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAllBrands);
router.get('/options', getBrandOptions);  // For product dropdown
router.get('/:id', getBrandById);

// Admin only routes
router.post('/',  uploadBrandLogo, createBrand);
router.put('/:id', uploadBrandLogo, updateBrand);
router.delete('/:id', deleteBrand);

export default router;