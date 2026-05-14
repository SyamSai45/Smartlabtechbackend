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
router.post('/',  createContactInfo);
router.put('/',  updateContactInfo);
router.delete('/', deleteContactInfo);

export default router;