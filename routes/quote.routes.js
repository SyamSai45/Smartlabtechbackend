import express from 'express';
import {
  submitQuoteRequest,
  getAllQuotes,
  getQuoteById,
  updateQuoteStatus,
  deleteQuote,
  getQuoteStats
} from '../controllers/quote.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
// Submit quote request only
router.post('/submit', submitQuoteRequest);

// ==================== ADMIN ROUTES ====================
router.get('/admin/quotes', protect, authorize('admin'), getAllQuotes);
router.get('/admin/stats', protect, authorize('admin'), getQuoteStats);
router.get('/admin/quotes/:id', protect, authorize('admin'), getQuoteById);
router.put('/admin/quotes/:id', protect, authorize('admin'), updateQuoteStatus);
router.delete('/admin/quotes/:id', protect, authorize('admin'), deleteQuote);

export default router;