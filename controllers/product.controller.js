import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import fs from 'fs';
import {
  processMainImage,
  processGalleryImage,
  createThumbnail
} from '../config/sharp.config.js';

// Helper function to delete product images
const deleteProductImages = async (product) => {
  if (product.mainImage && fs.existsSync(product.mainImage)) {
    fs.unlinkSync(product.mainImage);
  }
  if (product.mainImageThumb && fs.existsSync(product.mainImageThumb)) {
    fs.unlinkSync(product.mainImageThumb);
  }
  if (product.gallery && product.gallery.length) {
    for (const image of product.gallery) {
      if (fs.existsSync(image)) fs.unlinkSync(image);
    }
  }
  if (product.galleryThumbs && product.galleryThumbs.length) {
    for (const thumb of product.galleryThumbs) {
      if (fs.existsSync(thumb)) fs.unlinkSync(thumb);
    }
  }
};

// Helper function to parse JSON fields
const parseJSONFields = (body) => {
  const jsonFields = ['specifications', 'features', 'applications', 'faqs', 'highlights', 'certifications'];
  jsonFields.forEach(field => {
    if (body[field]) {
      try {
        body[field] = JSON.parse(body[field]);
      } catch (e) {
        console.error(`Error parsing ${field}:`, e);
      }
    }
  });
  return body;
};

// @desc    Create product with image upload
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    console.log('📦 Creating product...');
    
    // Parse JSON fields
    req.body = parseJSONFields(req.body);
    
    const { name, brand, category } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }
    if (!brand) {
      return res.status(400).json({ success: false, message: 'Brand ID is required' });
    }
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category ID is required' });
    }

    // Check if product exists
    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      return res.status(400).json({ success: false, message: 'Product with this name already exists' });
    }

    // Verify brand exists
    const brandExists = await Brand.findById(brand);
    if (!brandExists) {
      return res.status(400).json({ success: false, message: 'Brand not found' });
    }

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: 'Category not found' });
    }

    // Process images - store URL paths
    if (req.files) {
      // Process main image
      if (req.files.mainImage && req.files.mainImage[0]) {
        const originalPath = req.files.mainImage[0].path;
        console.log(`📸 Original main image: ${originalPath}`);
        
        // Create optimized version and get URL path
        const optimizedPath = await processMainImage(originalPath);
        req.body.mainImage = optimizedPath; // Stores "/uploads/products/main/main-xxx.jpg"
        
        // Create thumbnail and get URL path
        req.body.mainImageThumb = await createThumbnail(originalPath);
        
        console.log(`✅ Main image URL: ${req.body.mainImage}`);
      }

      // Process gallery images
      if (req.files.gallery && req.files.gallery.length) {
        const galleryPaths = [];
        const galleryThumbPaths = [];
        
        for (const file of req.files.gallery) {
          const originalPath = file.path;
          console.log(`📸 Original gallery image: ${originalPath}`);
          
          // Create optimized version and get URL path
          const optimizedPath = await processGalleryImage(originalPath);
          galleryPaths.push(optimizedPath);
          
          // Create thumbnail and get URL path
          const thumbPath = await createThumbnail(originalPath);
          galleryThumbPaths.push(thumbPath);
        }
        
        req.body.gallery = galleryPaths;
        req.body.galleryThumbs = galleryThumbPaths;
      }
    }

    // Create product
    const product = await Product.create({
      ...req.body,
      brandName: brandExists.name,
      categoryName: categoryExists.name
    });

    await product.populate('brand category');

    // Build full URLs for response
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const productWithUrls = {
      ...product.toObject(),
      mainImageUrl: product.mainImage ? `${baseUrl}${product.mainImage}` : null,
      mainImageThumbUrl: product.mainImageThumb ? `${baseUrl}${product.mainImageThumb}` : null,
      galleryUrls: product.gallery ? product.gallery.map(img => `${baseUrl}${img}`) : []
    };

    res.status(201).json({ 
      success: true, 
      message: 'Product created successfully', 
      data: productWithUrls 
    });
  } catch (error) {
    console.error('❌ Create product error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all products
// @route   GET /api/products
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      brand,
      category,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Filters
    if (brand) query.brand = brand;
    if (category) query.category = category;
    if (inStock === 'true') query.inStock = true;
    if (isFeatured === 'true') query.isFeatured = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('brand', 'name logo description website')
      .populate('category', 'name')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
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

// @desc    Get product by ID
// @route   GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('brand', 'name logo description website')
      .populate('category', 'name');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Parse JSON fields
    req.body = parseJSONFields(req.body);

    // Process new images
    if (req.files) {
      // Delete old images
      await deleteProductImages(product);

      // Process new main image
      if (req.files.mainImage && req.files.mainImage[0]) {
        const mainImagePath = req.files.mainImage[0].path;
        req.body.mainImage = await processMainImage(mainImagePath);
        req.body.mainImageThumb = await createThumbnail(mainImagePath);
      }

      // Process new gallery images
      if (req.files.gallery && req.files.gallery.length) {
        const galleryPaths = [];
        const galleryThumbPaths = [];
        
        for (const file of req.files.gallery) {
          const processedPath = await processGalleryImage(file.path);
          galleryPaths.push(processedPath);
          
          const thumbPath = await createThumbnail(file.path);
          galleryThumbPaths.push(thumbPath);
        }
        
        req.body.gallery = galleryPaths;
        req.body.galleryThumbs = galleryThumbPaths;
      }
    }

    // Update brand name if brand changed
    if (req.body.brand && req.body.brand !== product.brand.toString()) {
      const brand = await Brand.findById(req.body.brand);
      if (brand) req.body.brandName = brand.name;
    }

    // Update category name if category changed
    if (req.body.category && req.body.category !== product.category.toString()) {
      const category = await Category.findById(req.body.category);
      if (category) req.body.categoryName = category.name;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('brand', 'name logo')
     .populate('category', 'name');

    res.json({ success: true, message: 'Product updated successfully', data: updatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete all product images
    await deleteProductImages(product);

    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
export const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const products = await Product.find({ isFeatured: true, isActive: true })
      .populate('brand', 'name logo')
      .limit(parseInt(limit))
      .sort({ rating: -1 });

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get products by brand
// @route   GET /api/products/brand/:brandId
export const getProductsByBrand = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const products = await Product.find({ brand: req.params.brandId, isActive: true })
      .populate('brand', 'name logo')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Product.countDocuments({ brand: req.params.brandId, isActive: true });

    res.json({
      success: true,
      data: products,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
export const getProductsByCategory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const products = await Product.find({ category: req.params.categoryId, isActive: true })
      .populate('category', 'name')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Product.countDocuments({ category: req.params.categoryId, isActive: true });

    res.json({
      success: true,
      data: products,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};