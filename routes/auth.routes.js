import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getAllAdmins,
  toggleAdminStatus,
  deleteAdmin
} from '../controllers/auth.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
router.post('/register', register);
router.post('/login', login);

// ==================== PROTECTED ROUTES ====================
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// ==================== ADMIN MANAGEMENT ====================
router.get('/admins', protect, getAllAdmins);
router.patch('/admins/:id/toggle', protect, toggleAdminStatus);
router.delete('/admins/:id', protect, deleteAdmin);

export default router;