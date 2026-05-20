import express from 'express';
import {
  getDashboardStats,
  getChartData,
  getTopPerforming,
  getRecentActivity,
  getQuickStats
} from '../controllers/dashboard.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All dashboard routes require admin authentication
router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/charts', getChartData);
router.get('/top', getTopPerforming);
router.get('/activity', getRecentActivity);
router.get('/quick-stats', getQuickStats); 

export default router;