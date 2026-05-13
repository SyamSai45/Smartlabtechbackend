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
      logoUrl = await processBrandLogo(originalPath); // FIXED: Assign to logoUrl
      // logoUrl will be like "/uploads/brands/logo-xxx.png"
    }

    const brand = await Brand.create({
      name,
      logo: logoUrl, // FIXED: Use logoUrl instead of req.body.logo
      description,
      website
    });

    // Return full URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const brandWithUrl = {
      ...brand.toObject(),
      logoUrl: brand.logo ? `${baseUrl}${brand.logo}` : null
    };

    res.status(201).json({ success: true, message: 'Brand created successfully', data: brandWithUrl });
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

    const brands = await Brand.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ name: 1 });

    const total = await Brand.countDocuments(query);

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
    res.json({ success: true, data: brand });
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
      req.body.logo = await processBrandLogo(req.file.path);
    }

    const updatedBrand = await Brand.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Brand updated successfully', data: updatedBrand });
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

// @desc    Get brand options for dropdown (used when creating products)
// @route   GET /api/brands/options
export const getBrandOptions = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true })
      .select('_id name logo')
      .sort({ name: 1 });
    
    res.json({ 
      success: true, 
      data: brands 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};