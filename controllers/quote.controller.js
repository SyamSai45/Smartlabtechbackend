import Quote from '../models/Quote.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { createNotification } from './notification.controller.js';

// Helper: Add full URLs to product image
const addProductUrl = (quote, baseUrl) => {
  const quoteObj = quote.toObject();
  if (quoteObj.product?.mainImage && !quoteObj.product.mainImage.startsWith('http')) {
    quoteObj.product.mainImage = `${baseUrl}${quoteObj.product.mainImage}`;
  }
  return quoteObj;
};

// Helper: Validate and get category/product
const validateCategoryProduct = async (categoryId, productId) => {
  const [category, product] = await Promise.all([
    Category.findById(categoryId),
    Product.findById(productId)
  ]);
  
  if (!category) throw new Error('Invalid category selected');
  if (!product) throw new Error('Invalid product selected');
  if (product.category.toString() !== categoryId) throw new Error('Product does not belong to the selected category');
  
  return { category, product };
};

// ==================== QUOTE REQUEST (PUBLIC) ====================
export const submitQuoteRequest = async (req, res) => {
  try {
    const { name, phoneNumber, email, company, city, category, product, usage, quantity } = req.body;
    const requiredFields = { name, phoneNumber, email, company, city, category, product, usage, quantity };
    
    const missingField = Object.entries(requiredFields).find(([_, value]) => !value)?.[0];
    if (missingField) {
      return res.status(400).json({ success: false, message: `${missingField} is required` });
    }
    
    const { category: categoryDoc, product: productDoc } = await validateCategoryProduct(category, product);
    
    const quote = await Quote.create({
      name, phoneNumber, email, company, city, category, product,
      categoryName: categoryDoc.name, productName: productDoc.name,
      usage, quantity, status: 'pending'
    });
    
    await quote.populate('category product');
    
    await createNotification('quote', quote._id, 'Quote', {
      name: quote.name, email: quote.email, company: quote.company,
      productName: quote.productName, quantity: quote.quantity, usage: quote.usage
    });
    
    res.status(201).json({ success: true, message: 'Quote request submitted successfully', data: quote });
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
    const { page = 1, limit = 20, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }, { productName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [quotes, total] = await Promise.all([
      Quote.find(query).populate('category', 'name').populate('product', 'name mainImage price')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit)),
      Quote.countDocuments(query)
    ]);
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      success: true,
      data: quotes.map(quote => addProductUrl(quote, baseUrl)),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET SINGLE QUOTE (ADMIN) ====================
export const getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('category', 'name')
      .populate('product', 'name mainImage price discountedPrice specifications brandName');
    
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addProductUrl(quote, baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== UPDATE QUOTE STATUS (ADMIN) ====================
export const updateQuoteStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'quoted', 'approved', 'rejected', 'completed'];
    
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    
    const quote = await Quote.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('category', 'name').populate('product', 'name');
    
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
    
    res.json({ success: true, message: 'Quote status updated successfully', data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== DELETE QUOTE (ADMIN) ====================
export const deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
    res.json({ success: true, message: 'Quote deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET QUOTE STATISTICS (ADMIN) ====================
export const getQuoteStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [total, pending, processing, quoted, approved, rejected, completed, recent] = await Promise.all([
      Quote.countDocuments(),
      Quote.countDocuments({ status: 'pending' }),
      Quote.countDocuments({ status: 'processing' }),
      Quote.countDocuments({ status: 'quoted' }),
      Quote.countDocuments({ status: 'approved' }),
      Quote.countDocuments({ status: 'rejected' }),
      Quote.countDocuments({ status: 'completed' }),
      Quote.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    ]);
    
    res.json({ success: true, data: { total, pending, processing, quoted, approved, rejected, completed, recent } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};