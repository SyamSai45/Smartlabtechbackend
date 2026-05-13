import Category from '../models/Category.js';

// @desc    Create category
// @route   POST /api/categories
export const createCategory = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    // Check if category exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category already exists' 
      });
    }

    // Create category
    const category = await Category.create({ 
      name, 
      isActive: isActive !== undefined ? isActive : true 
    });

    res.status(201).json({ 
      success: true, 
      message: 'Category created successfully', 
      data: category 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get all categories
// @route   GET /api/categories
export const getAllCategories = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    // Build query
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const categories = await Category.find(query)
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      count: categories.length,
      data: categories 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: category 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
export const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: category 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    
    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Category updated successfully', 
      data: category 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Category deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get category options for dropdown (only active categories)
// @route   GET /api/categories/options
export const getCategoryOptions = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name slug')
      .sort({ name: 1 });
    
    res.json({ 
      success: true, 
      data: categories 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Toggle category active status
// @route   PATCH /api/categories/:id/toggle
export const toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }
    
    category.isActive = !category.isActive;
    await category.save();
    
    res.json({ 
      success: true, 
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: category 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};