import Quote from '../models/Quote.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

import Notification from '../models/Notification.js';
import { createNotification } from './notification.controller.js';

// Update your submitQuoteRequest function
export const submitQuoteRequest = async (req, res) => {
  try {
    const { 
      name, phoneNumber, email, company, city, 
      category, product, usage, quantity 
    } = req.body;
    
    if (!name || !phoneNumber || !email || !company || !city || !category || !product || !usage || !quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ success: false, message: 'Invalid category selected' });
    }
    
    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(400).json({ success: false, message: 'Invalid product selected' });
    }
    
    if (productDoc.category.toString() !== category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product does not belong to the selected category' 
      });
    }
    
    const quote = await Quote.create({
      name,
      phoneNumber,
      email,
      company,
      city,
      category,
      categoryName: categoryDoc.name,
      product,
      productName: productDoc.name,
      usage,
      quantity,
      status: 'pending'
    });
    
    await quote.populate('category product');
    
    // Create notification for admin
    await createNotification('quote', quote._id, 'Quote', {
      name: quote.name,
      email: quote.email,
      company: quote.company,
      productName: quote.productName,
      quantity: quote.quantity,
      usage: quote.usage
    });
    
    res.status(201).json({
      success: true,
      message: 'Quote request submitted successfully',
      data: quote
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET ALL QUOTES (ADMIN) ====================
export const getAllQuotes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const quotes = await Quote.find(query)
      .populate('category', 'name')
      .populate('product', 'name mainImage price')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Quote.countDocuments(query);
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const quotesWithUrls = quotes.map(quote => {
      const quoteObj = quote.toObject();
      if (quoteObj.product?.mainImage && !quoteObj.product.mainImage.startsWith('http')) {
        quoteObj.product.mainImage = `${baseUrl}${quoteObj.product.mainImage}`;
      }
      return quoteObj;
    });
    
    res.json({
      success: true,
      data: quotesWithUrls,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET SINGLE QUOTE (ADMIN) ====================
export const getQuoteById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const quote = await Quote.findById(id)
      .populate('category', 'name')
      .populate('product', 'name mainImage price discountedPrice specifications brandName');
    
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const quoteObj = quote.toObject();
    if (quoteObj.product?.mainImage && !quoteObj.product.mainImage.startsWith('http')) {
      quoteObj.product.mainImage = `${baseUrl}${quoteObj.product.mainImage}`;
    }
    
    res.json({ success: true, data: quoteObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== UPDATE QUOTE STATUS (ADMIN) ====================
export const updateQuoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'processing', 'quoted', 'approved', 'rejected', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    
    const quote = await Quote.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('category', 'name')
     .populate('product', 'name');
    
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }
    
    res.json({
      success: true,
      message: 'Quote status updated successfully',
      data: quote
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== DELETE QUOTE (ADMIN) ====================
export const deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;
    
    const quote = await Quote.findByIdAndDelete(id);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }
    
    res.json({ success: true, message: 'Quote deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET QUOTE STATISTICS (ADMIN) ====================
export const getQuoteStats = async (req, res) => {
  try {
    const total = await Quote.countDocuments();
    const pending = await Quote.countDocuments({ status: 'pending' });
    const processing = await Quote.countDocuments({ status: 'processing' });
    const quoted = await Quote.countDocuments({ status: 'quoted' });
    const approved = await Quote.countDocuments({ status: 'approved' });
    const rejected = await Quote.countDocuments({ status: 'rejected' });
    const completed = await Quote.countDocuments({ status: 'completed' });
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent = await Quote.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    res.json({
      success: true,
      data: {
        total,
        pending,
        processing,
        quoted,
        approved,
        rejected,
        completed,
        recent
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};