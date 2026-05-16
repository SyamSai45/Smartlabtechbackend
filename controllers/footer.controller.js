import Footer from '../models/Footer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Save uploaded file
const saveFile = async (file, folder) => {
  if (!file) return null;
  
  if (typeof file === 'string' && (file.startsWith('http://') || file.startsWith('https://'))) {
    return file;
  }
  
  const uploadDir = path.join(__dirname, '../uploads/footer', folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname);
  const filename = `${folder}-${timestamp}-${random}${ext}`;
  const destPath = path.join(uploadDir, filename);
  
  fs.copyFileSync(file.path, destPath);
  try { fs.unlinkSync(file.path); } catch(e) {}
  
  return `/uploads/footer/${folder}/${filename}`;
};

// Helper: Convert string to boolean
const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value === 'true' || value === '1' || value === 'yes';
  }
  return Boolean(value);
};

// Helper: Parse JSON if string
const parseIfString = (value) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }
  return value;
};

// Helper: Add full URLs to response
const addFullUrls = (data, baseUrl) => {
  const result = { ...data };
  
  if (result.privacyPolicy?.file && !result.privacyPolicy.file.startsWith('http')) {
    result.privacyPolicy.file = `${baseUrl}${result.privacyPolicy.file}`;
  }
  if (result.cookiePolicy?.file && !result.cookiePolicy.file.startsWith('http')) {
    result.cookiePolicy.file = `${baseUrl}${result.cookiePolicy.file}`;
  }
  if (result.termsOfService?.file && !result.termsOfService.file.startsWith('http')) {
    result.termsOfService.file = `${baseUrl}${result.termsOfService.file}`;
  }
  
  return result;
};

// ==================== GET FOOTER (PUBLIC) ====================
export const getFooter = async (req, res) => {
  try {
    let footer = await Footer.findOne({ isActive: true })
      .populate('products.productId', 'name slug mainImage');
    
    if (!footer) {
      return res.status(404).json({ success: false, message: 'Footer not found' });
    }
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const footerWithUrls = addFullUrls(footer.toObject(), baseUrl);
    
    res.json({ success: true, data: footerWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CREATE FOOTER (ADMIN) ====================
export const createFooter = async (req, res) => {
  try {
    const existingFooter = await Footer.findOne();
    if (existingFooter) {
      return res.status(400).json({ success: false, message: 'Footer already exists. Use PUT to update.' });
    }
    
    // Parse data from request body
    let companyDescription = req.body.companyDescription;
    let companyContact = req.body.companyContact ? parseIfString(req.body.companyContact) : {};
    let socialMedia = req.body.socialMedia ? parseIfString(req.body.socialMedia) : {};
    let products = req.body.products ? parseIfString(req.body.products) : [];
    let services = req.body.services ? parseIfString(req.body.services) : [];
    let privacyPolicy = req.body.privacyPolicy ? parseIfString(req.body.privacyPolicy) : {};
    let cookiePolicy = req.body.cookiePolicy ? parseIfString(req.body.cookiePolicy) : {};
    let termsOfService = req.body.termsOfService ? parseIfString(req.body.termsOfService) : {};
    let copyrightText = req.body.copyrightText;
    
    // Handle policy file uploads
    if (req.files?.privacyPolicyFile) {
      privacyPolicy.file = await saveFile(req.files.privacyPolicyFile[0], 'policies');
    }
    if (req.files?.cookiePolicyFile) {
      cookiePolicy.file = await saveFile(req.files.cookiePolicyFile[0], 'policies');
    }
    if (req.files?.termsOfServiceFile) {
      termsOfService.file = await saveFile(req.files.termsOfServiceFile[0], 'policies');
    }
    
    const footer = await Footer.create({
      companyDescription,
      companyContact,
      socialMedia,
      products,
      services,
      privacyPolicy,
      cookiePolicy,
      termsOfService,
      copyrightText: copyrightText || `© ${new Date().getFullYear()} SmartLabTech. All rights reserved.`,
      isActive: true
    });
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const footerWithUrls = addFullUrls(footer.toObject(), baseUrl);
    
    res.status(201).json({ success: true, message: 'Footer created', data: footerWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update footer (Admin)
// @route   PUT /api/footer
export const updateFooter = async (req, res) => {
  try {
    let footer = await Footer.findOne();
    if (!footer) {
      return res.status(404).json({ success: false, message: 'Footer not found. Use POST to create.' });
    }
    
    // Update simple fields if provided
    if (req.body.companyDescription !== undefined) footer.companyDescription = req.body.companyDescription;
    if (req.body.copyrightText !== undefined) footer.copyrightText = req.body.copyrightText;
    if (req.body.isActive !== undefined) footer.isActive = toBoolean(req.body.isActive);
    
    // Update company contact if provided
    if (req.body.companyContact !== undefined) {
      const companyContact = parseIfString(req.body.companyContact);
      footer.companyContact = { ...footer.companyContact.toObject(), ...companyContact };
    }
    
    // Update social media if provided
    if (req.body.socialMedia !== undefined) {
      const socialMedia = parseIfString(req.body.socialMedia);
      footer.socialMedia = { ...footer.socialMedia.toObject(), ...socialMedia };
    }
    
    // Update products if provided (replace entire array)
    if (req.body.products !== undefined) {
      footer.products = parseIfString(req.body.products);
    }
    
    // Update services if provided (replace entire array)
    if (req.body.services !== undefined) {
      footer.services = parseIfString(req.body.services);
    }
    
    // Update privacy policy - handle file upload
    if (req.body.privacyPolicy !== undefined || req.files?.privacyPolicyFile) {
      let privacyPolicy = footer.privacyPolicy ? footer.privacyPolicy.toObject() : {};
      
      if (req.body.privacyPolicy !== undefined) {
        const newPolicy = parseIfString(req.body.privacyPolicy);
        privacyPolicy = { ...privacyPolicy, ...newPolicy };
      }
      
      if (req.files?.privacyPolicyFile) {
        privacyPolicy.file = await saveFile(req.files.privacyPolicyFile[0], 'policies');
        privacyPolicy.uploadedAt = new Date();
      }
      
      footer.privacyPolicy = privacyPolicy;
    }
    
    // Update cookie policy - handle file upload
    if (req.body.cookiePolicy !== undefined || req.files?.cookiePolicyFile) {
      let cookiePolicy = footer.cookiePolicy ? footer.cookiePolicy.toObject() : {};
      
      if (req.body.cookiePolicy !== undefined) {
        const newPolicy = parseIfString(req.body.cookiePolicy);
        cookiePolicy = { ...cookiePolicy, ...newPolicy };
      }
      
      if (req.files?.cookiePolicyFile) {
        cookiePolicy.file = await saveFile(req.files.cookiePolicyFile[0], 'policies');
        cookiePolicy.uploadedAt = new Date();
      }
      
      footer.cookiePolicy = cookiePolicy;
    }
    
    // Update terms of service - handle file upload
    if (req.body.termsOfService !== undefined || req.files?.termsOfServiceFile) {
      let termsOfService = footer.termsOfService ? footer.termsOfService.toObject() : {};
      
      if (req.body.termsOfService !== undefined) {
        const newPolicy = parseIfString(req.body.termsOfService);
        termsOfService = { ...termsOfService, ...newPolicy };
      }
      
      if (req.files?.termsOfServiceFile) {
        termsOfService.file = await saveFile(req.files.termsOfServiceFile[0], 'policies');
        termsOfService.uploadedAt = new Date();
      }
      
      footer.termsOfService = termsOfService;
    }
    
    await footer.save();
    
    // Populate product details
    await footer.populate('products.productId', 'name slug mainImage');
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const footerWithUrls = addFullUrls(footer.toObject(), baseUrl);
    
    res.json({ success: true, message: 'Footer updated', data: footerWithUrls });
  } catch (error) {
    console.error('Update footer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// ==================== DELETE FOOTER (ADMIN) ====================
export const deleteFooter = async (req, res) => {
  try {
    const footer = await Footer.findOne();
    if (!footer) {
      return res.status(404).json({ success: false, message: 'Footer not found' });
    }
    await Footer.deleteMany({});
    res.json({ success: true, message: 'Footer deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ADD PRODUCT LINK (ADMIN) ====================
export const addProductLink = async (req, res) => {
  try {
    const footer = await Footer.findOne();
    if (!footer) {
      return res.status(404).json({ success: false, message: 'Footer not found' });
    }
    
    const { productId, name } = req.body;
    footer.products.push({ productId, name });
    await footer.save();
    
    res.status(201).json({ success: true, message: 'Product link added', data: footer.products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== REMOVE PRODUCT LINK (ADMIN) ====================
export const removeProductLink = async (req, res) => {
  try {
    const { index } = req.params;
    const footer = await Footer.findOne();
    if (!footer) {
      return res.status(404).json({ success: false, message: 'Footer not found' });
    }
    
    if (index < 0 || index >= footer.products.length) {
      return res.status(404).json({ success: false, message: 'Product link not found' });
    }
    
    footer.products.splice(index, 1);
    await footer.save();
    
    res.json({ success: true, message: 'Product link removed', data: footer.products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ADD SERVICE LINK (ADMIN) ====================
export const addServiceLink = async (req, res) => {
  try {
    const footer = await Footer.findOne();
    if (!footer) {
      return res.status(404).json({ success: false, message: 'Footer not found' });
    }
    
    const { name } = req.body;
    footer.services.push({ name });
    await footer.save();
    
    res.status(201).json({ success: true, message: 'Service link added', data: footer.services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== REMOVE SERVICE LINK (ADMIN) ====================
export const removeServiceLink = async (req, res) => {
  try {
    const { index } = req.params;
    const footer = await Footer.findOne();
    if (!footer) {
      return res.status(404).json({ success: false, message: 'Footer not found' });
    }
    
    if (index < 0 || index >= footer.services.length) {
      return res.status(404).json({ success: false, message: 'Service link not found' });
    }
    
    footer.services.splice(index, 1);
    await footer.save();
    
    res.json({ success: true, message: 'Service link removed', data: footer.services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};