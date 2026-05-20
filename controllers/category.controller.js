import Category from '../models/Category.js';
import Product from '../models/Product.js';

// Helper: Add full URLs to product data
const addProductUrls = (product, baseUrl) => {
  const productObj = product.toObject();
  
  if (productObj.mainImage && !productObj.mainImage.startsWith('http')) {
    productObj.mainImage = `${baseUrl}${productObj.mainImage}`;
  }
  
  if (productObj.gallery?.length) {
    productObj.gallery = productObj.gallery.map(img => 
      img && !img.startsWith('http') ? `${baseUrl}${img}` : img
    );
  }
  
  if (productObj.brand?.logo && !productObj.brand.logo.startsWith('http')) {
    productObj.brand.logo = `${baseUrl}${productObj.brand.logo}`;
  }
  
  return productObj;
};

// Helper: Get products with URLs
const getProductsWithUrls = async (categoryId, baseUrl, selectFields = null, includeInactive = false) => {
  const query = { category: categoryId };
  if (!includeInactive) query.isActive = true;
  
  const products = await Product.find(query)
    .populate('brand', 'name logo description website')
    .select(selectFields || 'name brandName mainImage gallery price discountedPrice shortDesc rating reviews inStock isFeatured slug')
    .sort({ createdAt: -1 });
  
  return products.map(product => addProductUrls(product, baseUrl));
};

// @desc    Create category
export const createCategory = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    
    if (await Category.findOne({ name })) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }
    
    const category = await Category.create({ name, isActive: isActive !== undefined ? isActive : true });
    res.status(201).json({ success: true, message: 'Category created successfully', data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = isActive !== undefined ? { isActive: isActive === 'true' } : {};
    const categories = await Category.find(query).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get category options for dropdown
export const getCategoryOptions = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).select('_id name').sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update category
export const updateCategory = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    
    res.json({ success: true, message: 'Category updated successfully', data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete category
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all categories with their products
export const getCategoriesWithProducts = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    if (!categories.length) {
      return res.status(404).json({ success: false, message: 'No categories found' });
    }
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const categoriesWithProducts = await Promise.all(
      categories.map(async (category) => {
        const products = await getProductsWithUrls(category._id, baseUrl, 'name brandName mainImage price discountedPrice slug rating isActive');
        return { ...category.toObject(), products, productCount: products.length };
      })
    );
    
    res.json({ success: true, totalCategories: categoriesWithProducts.length, data: categoriesWithProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single category with its products
export const getCategoryWithProducts = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const products = await getProductsWithUrls(category._id, baseUrl, null, false);
    
    res.json({ success: true, data: { ...category.toObject(), products, productCount: products.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};