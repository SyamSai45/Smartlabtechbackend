import express from 'express';
import multer from 'multer';
import {
  createContactHero, updateContactHero, getContactHero, deleteContactHero,
  createSubject, getAllSubjects, getActiveSubjects, getSubjectById,
  updateSubject, deleteSubject, toggleSubjectStatus,
  submitContactForm, getAllContacts, getContactById, updateContactStatus, deleteContact, getContactStats
} from '../controllers/contact.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// Public routes
router.get('/hero', getContactHero);
router.get('/subjects/active', getActiveSubjects);
router.post('/submit', submitContactForm);

// Contact Hero (Admin)
router.route('/hero')
  .post(protect, authorize('admin'), upload.single('image'), createContactHero)
  .put(protect, authorize('admin'), upload.single('image'), updateContactHero)
  .delete(protect, authorize('admin'), deleteContactHero);

// Subjects (Admin)
router.route('/subjects')
  .get(getAllSubjects)
  .post(protect, authorize('admin'), createSubject);
router.route('/subjects/:id')
  .get(protect, authorize('admin'), getSubjectById)
  .put(protect, authorize('admin'), updateSubject)
  .delete(protect, authorize('admin'), deleteSubject);
router.patch('/subjects/:id/toggle', protect, authorize('admin'), toggleSubjectStatus);

// Contact Submissions (Admin)
router.get('/all', getAllContacts);
router.get('/stats', getContactStats);
router.route('/:id/status')
  .get(protect, authorize('admin'), getContactById)
  .put(protect, authorize('admin'), updateContactStatus)
  .delete(protect, authorize('admin'), deleteContact);

export default router;