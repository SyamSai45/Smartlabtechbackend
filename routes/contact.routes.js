import express from 'express';
import  multer from 'multer';
import {
  createContactHero,
  getContactHero,
  updateContactHero,
  deleteContactHero,
  // Subject Management
  createSubject,
  getAllSubjects,
  getActiveSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  toggleSubjectStatus,
  // Contact Management
  submitContactForm,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
  getContactStats
} from '../controllers/contact.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// ==================== CONTACT HERO (ADMIN) ====================
router.post('/hero', upload.single('image'), createContactHero);
router.get('/hero', getContactHero);
router.put('/hero', upload.single('image'), updateContactHero);
router.delete('/hero', deleteContactHero);

// ==================== PUBLIC ROUTES ====================
router.get('/subjects/active', getActiveSubjects);
router.post('/submit', submitContactForm);

// ==================== SUBJECT MANAGEMENT (ADMIN ONLY) ====================
router.post('/subjects', createSubject);
router.get('/subjects', getAllSubjects);
router.get('/subject/:id', getSubjectById);
router.put('/subjects/:id', updateSubject);
router.patch('/subjects/:id/toggle', toggleSubjectStatus);
router.delete('/subjects/:id', deleteSubject);

// ==================== CONTACT MANAGEMENT (ADMIN ONLY) ====================
router.get('/stats', getContactStats);
router.get('/all', getAllContacts);
router.get('/:id', getContactById); 
router.put('/:id/status', updateContactStatus);
router.delete('/:id', deleteContact);

export default router;