import Brand from '../models/Brand.js';
import fs from 'fs';
import { processBrandLogo } from '../config/sharp.config.js';

// Helper: Add full URL to logo
const addFullUrl = (data, baseUrl) => {
  if (!data) return data;
  const result = data.toObject ? data.toObject() : { ...data };
  if (result.logo && !result.logo.startsWith('http')) {
    result.logo = `${baseUrl}${result.logo}`;
  }
  return result;
};

// Helper: Clean up file
const cleanupFile = (file) => {
  if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
};

// Helper: Process logo upload
const processLogo = async (file, protocol, host) => {
  if (!file) return null;
  const relativePath = await processBrandLogo(file.path);
  return relativePath ? `${protocol}://${host}${relativePath}` : null;
};

// @desc    Create brand
export const createBrand = async (req, res) => {
  try {
    const { name, description, website } = req.body;
    
    if (await Brand.findOne({ name })) {
      cleanupFile(req.file);
      return res.status(400).json({ success: false, message: 'Brand already exists' });
    }
    
    const logo = await processLogo(req.file, req.protocol, req.get('host'));
    const brand = await Brand.create({ name, logo, description, website });
    
    res.status(201).json({ success: true, message: 'Brand created successfully', data: brand.toObject() });
  } catch (error) {
    cleanupFile(req.file);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all brands
export const getAllBrands = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 20 } = req.query;
    const query = isActive ? { isActive: isActive === 'true' } : {};
    
    const brands = await Brand.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ name: 1 });
    
    const total = await Brand.countDocuments(query);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    res.json({
      success: true,
      data: brands.map(brand => addFullUrl(brand, baseUrl)),
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get brand by ID
export const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrl(brand, baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update brand
export const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    
    if (req.file) {
      if (brand.logo && fs.existsSync(brand.logo.replace(/^https?:\/\/[^\/]+/, ''))) {
        fs.unlinkSync(brand.logo.replace(/^https?:\/\/[^\/]+/, ''));
      }
      req.body.logo = await processLogo(req.file, req.protocol, req.get('host'));
    }
    
    const updatedBrand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Brand updated successfully', data: addFullUrl(updatedBrand, baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete brand
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    
    if (brand.logo && fs.existsSync(brand.logo.replace(/^https?:\/\/[^\/]+/, ''))) {
      fs.unlinkSync(brand.logo.replace(/^https?:\/\/[^\/]+/, ''));
    }
    await brand.deleteOne();
    res.json({ success: true, message: 'Brand deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get brand options for dropdown
export const getBrandOptions = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true }).select('_id name logo').sort({ name: 1 });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: brands.map(brand => addFullUrl(brand, baseUrl)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};