import express from 'express';
import multer from 'multer';
import {
  getFooter,
  createFooter,
  updateFooter,
  deleteFooter,
  addProductLink,
  removeProductLink,
  addServiceLink,
  removeServiceLink
} from '../controllers/footer.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// File upload fields for policies
const policyUploadFields = upload.fields([
  { name: 'privacyPolicyFile', maxCount: 1 },
  { name: 'cookiePolicyFile', maxCount: 1 },
  { name: 'termsOfServiceFile', maxCount: 1 }
]);

// Public route
router.get('/', getFooter);

// Admin routes
router.post('/', protect, authorize('admin'), policyUploadFields, createFooter);
router.put('/', protect, authorize('admin'), policyUploadFields, updateFooter);
router.delete('/', protect, authorize('admin'), deleteFooter);

// Product links
router.post('/products', protect, authorize('admin'), addProductLink);
router.delete('/products/:index', protect, authorize('admin'), removeProductLink);

// Service links
router.post('/services', protect, authorize('admin'), addServiceLink);
router.delete('/services/:index', protect, authorize('admin'), removeServiceLink);

export default router;