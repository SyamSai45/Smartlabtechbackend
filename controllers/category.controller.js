import Category from '../models/Category.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

// @desc    Create category
export const createCategory = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({ 
      name, 
      isActive: isActive !== undefined ? isActive : true 
    });

    res.status(201).json({ success: true, message: 'Category created successfully', data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const categories = await Category.find(query).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get category options for dropdown
export const getCategoryOptions = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('_id name')
      .sort({ name: 1 });
    
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
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
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    res.json({ success: true, message: 'Category updated successfully', data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete category
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all categories with their products
// @route   GET /api/categories/with-products
export const getCategoriesWithProducts = async (req, res) => {
  try {
    console.log('📍 Fetching all categories with products...');
    
    const categories = await Category.find().sort({ name: 1 });

    if (!categories.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'No categories found' 
      });
    }

    const categoriesWithProducts = await Promise.all(
      categories.map(async (category) => {
        const products = await Product.find({ 
          category: category._id
        })
        .populate('brand', 'name logo')
        .select('name brandName mainImage price discountedPrice slug rating isActive')
        .sort({ createdAt: -1 });

        const categoryObj = category.toObject();
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        categoryObj.products = products.map(product => {
          const productObj = product.toObject();
          
          if (productObj.mainImage && !productObj.mainImage.startsWith('http')) {
            productObj.mainImage = `${baseUrl}${productObj.mainImage}`;
          }
          
          if (productObj.brand && productObj.brand.logo && !productObj.brand.logo.startsWith('http')) {
            productObj.brand.logo = `${baseUrl}${productObj.brand.logo}`;
          }
          
          return productObj;
        });

        categoryObj.productCount = products.length;
        return categoryObj;
      })
    );

    res.json({
      success: true,
      totalCategories: categoriesWithProducts.length,
      data: categoriesWithProducts
    });
  } catch (error) {
    console.error('Error in getCategoriesWithProducts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single category with its products (by ID only)
// @route   GET /api/categories/:id/with-products
export const getCategoryWithProducts = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📍 Fetching category with products for: ${id}`);
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    const products = await Product.find({ 
      category: category._id, 
      isActive: true 
    })
    .populate('brand', 'name logo description website')
    .select('name brandName mainImage gallery price discountedPrice shortDesc rating reviews inStock isFeatured slug')
    .sort({ createdAt: -1 });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const categoryObj = category.toObject();
    
    categoryObj.products = products.map(product => {
      const productObj = product.toObject();
      
      if (productObj.mainImage && !productObj.mainImage.startsWith('http')) {
        productObj.mainImage = `${baseUrl}${productObj.mainImage}`;
      }
      
      if (productObj.gallery && productObj.gallery.length) {
        productObj.gallery = productObj.gallery.map(img => 
          img && !img.startsWith('http') ? `${baseUrl}${img}` : img
        );
      }
      
      if (productObj.brand && productObj.brand.logo && !productObj.brand.logo.startsWith('http')) {
        productObj.brand.logo = `${baseUrl}${productObj.brand.logo}`;
      }
      
      return productObj;
    });

    categoryObj.productCount = products.length;

    res.json({
      success: true,
      data: categoryObj
    });
  } catch (error) {
    console.error('Error in getCategoryWithProducts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};