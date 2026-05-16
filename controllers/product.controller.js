import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import fs from 'fs';
import {
  processMainImage,
  processGalleryImage
} from '../config/sharp.config.js';

// Helper function to delete product images
const deleteProductImages = async (product) => {
  if (product.mainImage && fs.existsSync(product.mainImage)) {
    fs.unlinkSync(product.mainImage);
  }
  if (product.gallery && product.gallery.length) {
    for (const image of product.gallery) {
      if (fs.existsSync(image)) fs.unlinkSync(image);
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

// Helper function to convert relative paths to full URLs and add slug
const addFullUrls = (product, baseUrl) => {
  const productObj = product.toObject();
  
  // Convert mainImage
  if (productObj.mainImage && !productObj.mainImage.startsWith('http')) {
    productObj.mainImage = `${baseUrl}${productObj.mainImage}`;
  }
  
  // Convert gallery
  if (productObj.gallery && productObj.gallery.length) {
    productObj.gallery = productObj.gallery.map(img => 
      img && !img.startsWith('http') ? `${baseUrl}${img}` : img
    );
  }
  
  // Convert brand logo if exists
  if (productObj.brand && productObj.brand.logo && !productObj.brand.logo.startsWith('http')) {
    productObj.brand.logo = `${baseUrl}${productObj.brand.logo}`;
  }
  
  // Ensure slug is included
  if (!productObj.slug && productObj.name) {
    productObj.slug = productObj.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // Remove duplicate URL fields if they exist
  delete productObj.mainImageUrl;
  delete productObj.galleryUrls;
  
  return productObj;
};

// @desc    Create product with image upload
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
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

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if product exists by name or slug
    const existingProduct = await Product.findOne({ $or: [{ name }, { slug }] });
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

    // Process images - store relative paths in DB
    if (req.files) {
      // Process main image
      if (req.files.mainImage && req.files.mainImage[0]) {
        const originalPath = req.files.mainImage[0].path;
        const relativePath = await processMainImage(originalPath);
        req.body.mainImage = relativePath;
      }

      // Process gallery images
      if (req.files.gallery && req.files.gallery.length) {
        const galleryPaths = [];
        
        for (const file of req.files.gallery) {
          const originalPath = file.path;
          const relativePath = await processGalleryImage(originalPath);
          galleryPaths.push(relativePath);
        }
        
        req.body.gallery = galleryPaths;
      }
    }

    // Create product with slug
    const product = await Product.create({
      ...req.body,
      slug,
      brandName: brandExists.name,
      categoryName: categoryExists.name
    });

    await product.populate('brand category');

    // Convert relative paths to full URLs for response
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const responseData = addFullUrls(product, baseUrl);

    res.status(201).json({ 
      success: true, 
      message: 'Product created successfully', 
      data: responseData 
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

    if (search) {
      query.$text = { $search: search };
    }
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

    // Convert relative paths to full URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const productsWithUrls = products.map(product => addFullUrls(product, baseUrl));

    res.json({
      success: true,
      data: productsWithUrls,
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

// @desc    Get product by ID (includes slug)
// @route   GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('brand', 'name logo description website')
      .populate('category', 'name');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const responseData = addFullUrls(product, baseUrl);

    res.json({ success: true, data: responseData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get product by slug (URL-friendly name)
// @route   GET /api/products/slug/:slug
// @route   GET /api/products/:slug
export const getProductBySlug = async (req, res) => {
  try {
    // Get slug from either route parameter
    const slug = req.params.slug || req.params.id; // Fallback to :id if :slug is not defined
    
    console.log(`📍 Fetching product with slug: "${slug}"`);
    
    // Validate slug exists
    if (!slug) {
      return res.status(400).json({ 
        success: false, 
        message: 'Slug parameter is required' 
      });
    }
    
    // Find product by slug (case-insensitive)
    const product = await Product.findOne({ 
      slug: { $regex: new RegExp(`^${slug}$`, 'i') } 
    })
    .populate('brand', 'name logo description website')
    .populate('category', 'name');

    console.log(`🔍 Product found: ${product ? product.name : 'No product found'}`);

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: `Product not found with slug: "${slug}"` 
      });
    }

    // Convert relative paths to full URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const responseData = addFullUrls(product, baseUrl);

    res.json({ 
      success: true, 
      data: responseData 
    });
  } catch (error) {
    console.error('Error in getProductBySlug:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Get product by name (search by exact name or partial match)
// @route   GET /api/products/name/:name
export const getProductByName = async (req, res) => {
  try {
    const { name } = req.params;
    const { exact = 'false' } = req.query;

    let query = {};

    if (exact === 'true') {
      query = { name: name };
    } else {
      query = { name: { $regex: name, $options: 'i' } };
    }

    const products = await Product.find(query)
      .populate('brand', 'name logo description website')
      .populate('category', 'name')
      .sort({ name: 1 });

    if (products.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: `No products found with name containing "${name}"` 
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const productsWithUrls = products.map(product => addFullUrls(product, baseUrl));

    res.json({ 
      success: true, 
      count: productsWithUrls.length,
      data: productsWithUrls 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get featured products (includes slug)
// @route   GET /api/products/featured
export const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const products = await Product.find({ isFeatured: true, isActive: true })
      .populate('brand', 'name logo')
      .limit(parseInt(limit))
      .sort({ rating: -1 });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const productsWithUrls = products.map(product => addFullUrls(product, baseUrl));

    res.json({ success: true, data: productsWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get products by brand (includes slug)
// @route   GET /api/products/brand/:brandId
export const getProductsByBrand = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const products = await Product.find({ brand: req.params.brandId, isActive: true })
      .populate('brand', 'name logo')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Product.countDocuments({ brand: req.params.brandId, isActive: true });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const productsWithUrls = products.map(product => addFullUrls(product, baseUrl));

    res.json({
      success: true,
      data: productsWithUrls,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get products by category (includes slug)
// @route   GET /api/products/category/:categoryId
export const getProductsByCategory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const products = await Product.find({ category: req.params.categoryId, isActive: true })
      .populate('category', 'name')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Product.countDocuments({ category: req.params.categoryId, isActive: true });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const productsWithUrls = products.map(product => addFullUrls(product, baseUrl));

    res.json({
      success: true,
      data: productsWithUrls,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
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

    req.body = parseJSONFields(req.body);

    // Update slug if name changed
    if (req.body.name && req.body.name !== product.name) {
      req.body.slug = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Check if new slug already exists
      const existingProduct = await Product.findOne({ 
        slug: req.body.slug, 
        _id: { $ne: req.params.id } 
      });
      if (existingProduct) {
        return res.status(400).json({ 
          success: false, 
          message: 'Product with similar name already exists' 
        });
      }
    }

    if (req.files) {
      await deleteProductImages(product);

      if (req.files.mainImage && req.files.mainImage[0]) {
        const mainImagePath = req.files.mainImage[0].path;
        const relativePath = await processMainImage(mainImagePath);
        req.body.mainImage = relativePath;
      }

      if (req.files.gallery && req.files.gallery.length) {
        const galleryPaths = [];
        for (const file of req.files.gallery) {
          const relativePath = await processGalleryImage(file.path);
          galleryPaths.push(relativePath);
        }
        req.body.gallery = galleryPaths;
      }
    }

    if (req.body.brand && req.body.brand !== product.brand.toString()) {
      const brand = await Brand.findById(req.body.brand);
      if (brand) req.body.brandName = brand.name;
    }

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

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const responseData = addFullUrls(updatedProduct, baseUrl);

    res.json({ success: true, message: 'Product updated successfully', data: responseData });
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

    await deleteProductImages(product);
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Toggle product active status
// @route   PATCH /api/products/:id/toggle
export const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find product by ID
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    // Toggle the isActive status
    product.isActive = !product.isActive;
    
    // Save the updated product
    await product.save();
    
    // Populate brand and category for response
    await product.populate('brand', 'name logo');
    await product.populate('category', 'name');
    
    // Convert relative paths to full URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const responseData = addFullUrls(product, baseUrl);
    
    const statusMessage = product.isActive ? 'activated' : 'deactivated';
    
    res.json({ 
      success: true, 
      message: `Product ${statusMessage} successfully`,
      data: responseData
    });
  } catch (error) {
    console.error('Toggle product status error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};