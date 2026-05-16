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

// File upload fields configuration
const uploadPolicyFiles = upload.fields([
  { name: 'privacyPolicyFile', maxCount: 1 },
  { name: 'cookiePolicyFile', maxCount: 1 },
  { name: 'termsOfServiceFile', maxCount: 1 }
]);

// ==================== PUBLIC ROUTES ====================
router.get('/', getFooter);

// ==================== ADMIN ROUTES ====================
router.post('/', uploadPolicyFiles, createFooter);
router.put('/', uploadPolicyFiles, updateFooter);
router.delete('/', deleteFooter);

// Product links management
router.post('/products', addProductLink);
router.delete('/products/:index', removeProductLink);

// Service links management
router.post('/services', addServiceLink);
router.delete('/services/:index', removeServiceLink);

export default router;