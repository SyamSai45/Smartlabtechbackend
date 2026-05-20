import express from 'express';
import {
  getContactInfo,
  createContactInfo,
  updateContactInfo,
  deleteContactInfo
} from '../controllers/contactinfo.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route - get contact info
router.get('/', getContactInfo);

// Admin routes
router.post('/', protect, authorize('admin'),  createContactInfo);
router.put('/', protect, authorize('admin'),  updateContactInfo);
router.delete('/', protect, authorize('admin'), deleteContactInfo);

export default router;