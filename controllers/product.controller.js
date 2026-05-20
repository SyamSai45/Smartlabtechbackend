import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Suggestion from '../models/Suggestion.js';
import fs from 'fs';
import { processMainImage, processGalleryImage } from '../config/sharp.config.js';

// Helper: Delete product images
const deleteProductImages = async (product) => {
  const images = [product.mainImage, ...(product.gallery || [])];
  images.forEach(img => { if (img && fs.existsSync(img)) fs.unlinkSync(img); });
};

// Helper: Parse JSON fields
const parseJSONFields = (body) => {
  ['specifications', 'features', 'applications', 'faqs', 'highlights', 'certifications'].forEach(field => {
    if (body[field]) try { body[field] = JSON.parse(body[field]); } catch(e) {}
  });
  return body;
};

// Helper: Generate slug
const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Helper: Add full URLs to product
const addFullUrls = (product, baseUrl) => {
  const productObj = product.toObject();
  
  if (productObj.mainImage && !productObj.mainImage.startsWith('http')) 
    productObj.mainImage = `${baseUrl}${productObj.mainImage}`;
  
  if (productObj.gallery?.length) {
    productObj.gallery = productObj.gallery.map(img => 
      img && !img.startsWith('http') ? `${baseUrl}${img}` : img
    );
  }
  
  if (productObj.brand?.logo && !productObj.brand.logo.startsWith('http')) 
    productObj.brand.logo = `${baseUrl}${productObj.brand.logo}`;
  
  if (!productObj.slug && productObj.name) productObj.slug = generateSlug(productObj.name);
  delete productObj.mainImageUrl;
  delete productObj.galleryUrls;
  
  return productObj;
};

// Helper: Process images from request
const processProductImages = async (files) => {
  const result = {};
  if (files?.mainImage?.[0]) 
    result.mainImage = await processMainImage(files.mainImage[0].path);
  if (files?.gallery?.length) {
    result.gallery = await Promise.all(
      files.gallery.map(file => processGalleryImage(file.path))
    );
  }
  return result;
};

// Helper: Build product query from filters
const buildProductQuery = (req) => {
  const { search, brand, category, minPrice, maxPrice, inStock, isFeatured, minRating, q } = req.query;
  const query = { isActive: true };
  
  if (search || q) {
    const term = (search || q).trim();
    query.$or = [
      { name: { $regex: term, $options: 'i' } },
      { shortDesc: { $regex: term, $options: 'i' } },
      { fullDesc: { $regex: term, $options: 'i' } },
      { categoryName: { $regex: term, $options: 'i' } },
      { brandName: { $regex: term, $options: 'i' } }
    ];
  }
  
  if (brand) query.brand = brand.match(/^[0-9a-fA-F]{24}$/) ? brand : { brandName: { $regex: brand, $options: 'i' } };
  if (category) query.category = category.match(/^[0-9a-fA-F]{24}$/) ? category : { categoryName: { $regex: category, $options: 'i' } };
  if (inStock === 'true') query.inStock = true;
  if (isFeatured === 'true') query.isFeatured = true;
  if (minRating) query.rating = { $gte: parseFloat(minRating) };
  if (minPrice || maxPrice) query.price = { ...(minPrice && { $gte: parseFloat(minPrice) }), ...(maxPrice && { $lte: parseFloat(maxPrice) }) };
  
  return query;
};

// ==================== PRODUCT CRUD ====================

export const createProduct = async (req, res) => {
  try {
    req.body = parseJSONFields(req.body);
    const { name, brand, category } = req.body;
    
    if (!name || !brand || !category) {
      const missing = !name ? 'name' : !brand ? 'brand' : 'category';
      return res.status(400).json({ success: false, message: `${missing} is required` });
    }
    
    const slug = generateSlug(name);
    if (await Product.findOne({ $or: [{ name }, { slug }] })) {
      return res.status(400).json({ success: false, message: 'Product with this name already exists' });
    }
    
    const [brandExists, categoryExists] = await Promise.all([
      Brand.findById(brand), Category.findById(category)
    ]);
    if (!brandExists) return res.status(400).json({ success: false, message: 'Brand not found' });
    if (!categoryExists) return res.status(400).json({ success: false, message: 'Category not found' });
    
    const images = await processProductImages(req.files);
    const product = await Product.create({
      ...req.body, slug, ...images,
      brandName: brandExists.name, categoryName: categoryExists.name
    });
    
    await product.populate('brand category');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Product created successfully', data: addFullUrls(product, baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = buildProductQuery(req);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      Product.find(query).populate('brand category').sort(sort).limit(parseInt(limit)).skip(skip),
      Product.countDocuments(query)
    ]);
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      success: true,
      data: products.map(p => addFullUrls(p, baseUrl)),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('brand category');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls(product, baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductBySlug = async (req, res) => {
  try {
    const slug = req.params.slug || req.params.id;
    const product = await Product.findOne({ slug: { $regex: new RegExp(`^${slug}$`, 'i') } }).populate('brand category');
    if (!product) return res.status(404).json({ success: false, message: `Product not found with slug: "${slug}"` });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls(product, baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductByName = async (req, res) => {
  try{
    const { name } = req.params;
    const { exact = 'false' } = req.query;
    const query = exact === 'true' ? { name } : { name: { $regex: name, $options: 'i' } };
    const products = await Product.find(query).populate('brand category').sort({ name: 1 });
    if (!products.length) return res.status(404).json({ success: false, message: `No products found with name containing "${name}"` });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, count: products.length, data: products.map(p => addFullUrls(p, baseUrl)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true }).populate('brand', 'name logo').limit(parseInt(req.query.limit || 8)).sort({ rating: -1 });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: products.map(p => addFullUrls(p, baseUrl)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductsByBrand = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [products, total] = await Promise.all([
      Product.find({ brand: req.params.brandId, isActive: true }).populate('brand', 'name logo').limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit)),
      Product.countDocuments({ brand: req.params.brandId, isActive: true })
    ]);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: products.map(p => addFullUrls(p, baseUrl)), pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [products, total] = await Promise.all([
      Product.find({ category: req.params.categoryId, isActive: true }).populate('category', 'name').limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit)),
      Product.countDocuments({ category: req.params.categoryId, isActive: true })
    ]);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: products.map(p => addFullUrls(p, baseUrl)), pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    req.body = parseJSONFields(req.body);
    
    if (req.body.name && req.body.name !== product.name) {
      req.body.slug = generateSlug(req.body.name);
      if (await Product.findOne({ slug: req.body.slug, _id: { $ne: req.params.id } })) {
        return res.status(400).json({ success: false, message: 'Product with similar name already exists' });
      }
    }
    
    if (req.files) {
      await deleteProductImages(product);
      const images = await processProductImages(req.files);
      Object.assign(req.body, images);
    }
    
    if (req.body.brand && req.body.brand !== product.brand.toString()) {
      const brand = await Brand.findById(req.body.brand);
      if (brand) req.body.brandName = brand.name;
    }
    
    if (req.body.category && req.body.category !== product.category.toString()) {
      const category = await Category.findById(req.body.category);
      if (category) req.body.categoryName = category.name;
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('brand category');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Product updated successfully', data: addFullUrls(updatedProduct, baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await deleteProductImages(product);
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.isActive = !product.isActive;
    await product.save();
    await product.populate('brand category');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`, data: addFullUrls(product, baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const startTime = Date.now();
    const { sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = req.query;
    const query = buildProductQuery(req);
    const sort = sortBy === 'price' ? { discountedPrice: sortOrder === 'desc' ? -1 : 1 } : { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const [products, total] = await Promise.all([
      Product.find(query).populate('brand category').sort(sort).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit)),
      Product.countDocuments(query)
    ]);
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      success: true,
      count: products.length,
      data: products.map(p => addFullUrls(p, baseUrl)),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
      meta: { query: req.query.q || req.query.search || null, responseTime: `${Date.now() - startTime}ms`, totalResults: total }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSearchFilters = async (req, res) => {
  try {
    const { q } = req.query;
    let baseQuery = { isActive: true };
    if (q?.trim()) baseQuery.$or = [
      { name: { $regex: q, $options: 'i' } },
      { categoryName: { $regex: q, $options: 'i' } },
      { brandName: { $regex: q, $options: 'i' } }
    ];
    
    const [categories, brands, priceStats] = await Promise.all([
      Product.distinct('categoryName', baseQuery),
      Product.aggregate([{ $match: baseQuery }, { $group: { _id: { id: '$brand', name: '$brandName' } } }, { $project: { _id: 0, id: '$_id.id', name: '$_id.name' } }]),
      Product.aggregate([{ $match: baseQuery }, { $group: { _id: null, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } }])
    ]);
    
    res.json({
      success: true,
      data: {
        categories: categories.filter(c => c).sort(),
        brands: brands.filter(b => b?.name).sort((a, b) => a.name.localeCompare(b.name)),
        priceRange: priceStats[0] || { minPrice: 0, maxPrice: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== PRODUCT SUGGESTIONS ====================

export const getProductSuggestions = async (req, res) => {
  try {
    const suggestions = await Suggestion.find({ isActive: true }).populate({ path: 'productId', populate: { path: 'brand', select: 'name logo' } }).limit(parseInt(req.query.limit || 20));
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      success: true,
      data: {
        products: suggestions.map(s => {
          const p = s.productId;
          if (!p) return null;
          return {
            type: 'product', id: p._id, name: p.name, slug: p.slug,
            brandName: p.brandName, categoryName: p.categoryName,
            image: p.mainImage ? `${baseUrl}${p.mainImage}` : null,
            price: p.discountedPrice || p.price,
            brand: p.brand ? { id: p.brand._id, name: p.brand.name, logo: p.brand.logo ? `${baseUrl}${p.brand.logo}` : null } : null
          };
        }).filter(Boolean),
        categories: [], brands: []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addProductSuggestion = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });
    
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (await Suggestion.findOne({ productId })) return res.status(400).json({ success: false, message: 'Product already in suggestions' });
    
    await Suggestion.create({ productId, isActive: true });
    const newSuggestion = await Suggestion.findOne({ productId }).populate({ path: 'productId', populate: { path: 'brand', select: 'name logo' } });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const p = newSuggestion.productId;
    
    res.status(201).json({
      success: true, message: 'Product added to suggestions successfully',
      data: { type: 'product', id: p._id, name: p.name, slug: p.slug, brandName: p.brandName, categoryName: p.categoryName, image: p.mainImage ? `${baseUrl}${p.mainImage}` : null, price: p.discountedPrice || p.price, isActive: newSuggestion.isActive, brand: p.brand ? { id: p.brand._id, name: p.brand.name, logo: p.brand.logo ? `${baseUrl}${p.brand.logo}` : null } : null }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeProductSuggestion = async (req, res) => {
  try {
    const suggestion = await Suggestion.findOneAndDelete({ productId: req.params.productId });
    if (!suggestion) return res.status(404).json({ success: false, message: 'Suggestion not found' });
    res.json({ success: true, message: 'Product removed from suggestions successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleSuggestionStatus = async (req, res) => {
  try {
    const suggestion = await Suggestion.findOne({ productId: req.params.productId });
    if (!suggestion) return res.status(404).json({ success: false, message: 'Suggestion not found' });
    suggestion.isActive = !suggestion.isActive;
    await suggestion.save();
    res.json({ success: true, message: `Suggestion ${suggestion.isActive ? 'activated' : 'deactivated'} successfully`, data: { productId: req.params.productId, isActive: suggestion.isActive } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkAddProductSuggestions = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds?.length) return res.status(400).json({ success: false, message: 'Product IDs array is required' });
    
    const results = { added: [], skipped: [], notFound: [] };
    for (const productId of productIds) {
      if (await Suggestion.findOne({ productId })) results.skipped.push(productId);
      else if (await Product.findById(productId)) {
        await Suggestion.create({ productId, isActive: true });
        results.added.push(productId);
      } else results.notFound.push(productId);
    }
    res.json({ success: true, message: `${results.added.length} added, ${results.skipped.length} skipped, ${results.notFound.length} not found`, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};