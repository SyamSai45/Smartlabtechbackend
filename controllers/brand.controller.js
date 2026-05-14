import Brand from '../models/Brand.js';
import fs from 'fs';
import { processBrandLogo } from '../config/sharp.config.js';

// @desc    Create brand with logo upload
// @route   POST /api/brands
export const createBrand = async (req, res) => {
  try {
    const { name, description, website } = req.body;

    // Check if brand exists
    const existingBrand = await Brand.findOne({ name });
    if (existingBrand) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ success: false, message: 'Brand already exists' });
    }

    let logoUrl = null;
    
    // Process logo if uploaded
    if (req.file) {
      const originalPath = req.file.path;
      const relativePath = await processBrandLogo(originalPath);
      // Convert relative path to full URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      logoUrl = relativePath ? `${baseUrl}${relativePath}` : null;
    }

    const brand = await Brand.create({
      name,
      logo: logoUrl, // Store full URL directly
      description,
      website
    });

    res.status(201).json({ 
      success: true, 
      message: 'Brand created successfully', 
      data: brand.toObject() 
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all brands
// @route   GET /api/brands
export const getAllBrands = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 20 } = req.query;
    const query = {};
    if (isActive) query.isActive = isActive === 'true';

    let brands = await Brand.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ name: 1 });

    const total = await Brand.countDocuments(query);
    
    // Add full URLs to logo field
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    brands = brands.map(brand => {
      const brandObj = brand.toObject();
      if (brandObj.logo && !brandObj.logo.startsWith('http')) {
        brandObj.logo = `${baseUrl}${brandObj.logo}`;
      }
      return brandObj;
    });

    res.json({
      success: true,
      data: brands,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get brand by ID
// @route   GET /api/brands/:id
export const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    
    // Add full URL to logo field
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const brandObj = brand.toObject();
    if (brandObj.logo && !brandObj.logo.startsWith('http')) {
      brandObj.logo = `${baseUrl}${brandObj.logo}`;
    }
    
    res.json({ success: true, data: brandObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update brand
// @route   PUT /api/brands/:id
export const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    // Process new logo if uploaded
    if (req.file) {
      // Delete old logo
      if (brand.logo && fs.existsSync(brand.logo)) {
        fs.unlinkSync(brand.logo);
      }
      const relativePath = await processBrandLogo(req.file.path);
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      req.body.logo = relativePath ? `${baseUrl}${relativePath}` : null;
    }

    const updatedBrand = await Brand.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Add full URL to logo field
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const brandObj = updatedBrand.toObject();
    if (brandObj.logo && !brandObj.logo.startsWith('http')) {
      brandObj.logo = `${baseUrl}${brandObj.logo}`;
    }

    res.json({ success: true, message: 'Brand updated successfully', data: brandObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete brand
// @route   DELETE /api/brands/:id
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    // Delete logo file
    if (brand.logo && fs.existsSync(brand.logo)) {
      fs.unlinkSync(brand.logo);
    }

    await brand.deleteOne();
    res.json({ success: true, message: 'Brand deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get brand options for dropdown
// @route   GET /api/brands/options
export const getBrandOptions = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true })
      .select('_id name logo')
      .sort({ name: 1 });
    
    // Add full URLs to logo field
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const brandsWithUrls = brands.map(brand => {
      const brandObj = brand.toObject();
      if (brandObj.logo && !brandObj.logo.startsWith('http')) {
        brandObj.logo = `${baseUrl}${brandObj.logo}`;
      }
      return brandObj;
    });
    
    res.json({ 
      success: true, 
      data: brandsWithUrls 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};