import Footer from '../models/Footer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Save uploaded file
const saveFile = async (file, folder) => {
  if (!file) return null;
  if (typeof file === 'string' && file.startsWith('http')) return file;
  
  const uploadDir = path.join(__dirname, '../uploads/footer', folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  
  const filename = `${folder}-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
  fs.copyFileSync(file.path, path.join(uploadDir, filename));
  try { fs.unlinkSync(file.path); } catch(e) {}
  
  return `/uploads/footer/${folder}/${filename}`;
};

// Helper: Parse JSON if string
const parseIfString = (value) => {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (e) { return value; }
  }
  return value;
};

// Helper: Add full URLs to response
const addFullUrls = (data, baseUrl) => {
  const result = { ...data };
  const policies = ['privacyPolicy', 'cookiePolicy', 'termsOfService'];
  policies.forEach(policy => {
    if (result[policy]?.file && !result[policy].file.startsWith('http')) {
      result[policy].file = `${baseUrl}${result[policy].file}`;
    }
  });
  return result;
};

// Helper: Update policy with file
const updatePolicy = async (policyData, file, existingPolicy = {}) => {
  let policy = existingPolicy.toObject ? existingPolicy.toObject() : { ...existingPolicy };
  if (policyData) {
    const newPolicy = parseIfString(policyData);
    policy = { ...policy, ...newPolicy };
  }
  if (file) {
    policy.file = await saveFile(file, 'policies');
    policy.uploadedAt = new Date();
  }
  return policy;
};

// Helper: Handle array operations (add/remove)
const handleArrayOperation = async (req, res, arrayName, itemName, createItem) => {
  try {
    const footer = await Footer.findOne();
    if (!footer) return res.status(404).json({ success: false, message: 'Footer not found' });
    
    if (req.method === 'POST') {
      const item = createItem(req.body);
      footer[arrayName].push(item);
      await footer.save();
      res.status(201).json({ success: true, message: `${itemName} added`, data: footer[arrayName] });
    } else {
      const { index } = req.params;
      if (index < 0 || index >= footer[arrayName].length) {
        return res.status(404).json({ success: false, message: `${itemName} not found` });
      }
      footer[arrayName].splice(index, 1);
      await footer.save();
      res.json({ success: true, message: `${itemName} removed`, data: footer[arrayName] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== FOOTER CRUD ====================

export const getFooter = async (req, res) => {
  try {
    const footer = await Footer.findOne({ isActive: true }).populate('products.productId', 'name slug mainImage');
    if (!footer) return res.status(404).json({ success: false, message: 'Footer not found' });
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls(footer.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFooter = async (req, res) => {
  try {
    if (await Footer.findOne()) {
      return res.status(400).json({ success: false, message: 'Footer already exists. Use PUT to update.' });
    }
    
    const policies = ['privacyPolicy', 'cookiePolicy', 'termsOfService'];
    const policyData = {};
    for (const policy of policies) {
      policyData[policy] = req.body[policy] ? parseIfString(req.body[policy]) : {};
      if (req.files?.[`${policy}File`]) {
        policyData[policy].file = await saveFile(req.files[`${policy}File`][0], 'policies');
      }
    }
    
    const footer = await Footer.create({
      companyDescription: req.body.companyDescription,
      companyContact: req.body.companyContact ? parseIfString(req.body.companyContact) : {},
      socialMedia: req.body.socialMedia ? parseIfString(req.body.socialMedia) : {},
      products: req.body.products ? parseIfString(req.body.products) : [],
      services: req.body.services ? parseIfString(req.body.services) : [],
      ...policyData,
      copyrightText: req.body.copyrightText || `© ${new Date().getFullYear()} SmartLabTech. All rights reserved.`,
      isActive: true
    });
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Footer created', data: addFullUrls(footer.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFooter = async (req, res) => {
  try {
    const footer = await Footer.findOne();
    if (!footer) return res.status(404).json({ success: false, message: 'Footer not found. Use POST to create.' });
    
    // Simple fields
    if (req.body.companyDescription !== undefined) footer.companyDescription = req.body.companyDescription;
    if (req.body.copyrightText !== undefined) footer.copyrightText = req.body.copyrightText;
    if (req.body.isActive !== undefined) footer.isActive = req.body.isActive === 'true';
    
    // Nested objects
    if (req.body.companyContact) {
      footer.companyContact = { ...footer.companyContact.toObject(), ...parseIfString(req.body.companyContact) };
    }
    if (req.body.socialMedia) {
      footer.socialMedia = { ...footer.socialMedia.toObject(), ...parseIfString(req.body.socialMedia) };
    }
    if (req.body.products !== undefined) footer.products = parseIfString(req.body.products);
    if (req.body.services !== undefined) footer.services = parseIfString(req.body.services);
    
    // Update policies with file uploads
    const policies = ['privacyPolicy', 'cookiePolicy', 'termsOfService'];
    for (const policy of policies) {
      if (req.body[policy] !== undefined || req.files?.[`${policy}File`]) {
        footer[policy] = await updatePolicy(req.body[policy], req.files?.[`${policy}File`]?.[0], footer[policy]);
      }
    }
    
    await footer.save();
    await footer.populate('products.productId', 'name slug mainImage');
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Footer updated', data: addFullUrls(footer.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFooter = async (req, res) => {
  try {
    const footer = await Footer.findOne();
    if (!footer) return res.status(404).json({ success: false, message: 'Footer not found' });
    await Footer.deleteMany({});
    res.json({ success: true, message: 'Footer deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== PRODUCT LINKS ====================
export const addProductLink = async (req, res) => {
  await handleArrayOperation(req, res, 'products', 'Product link', (body) => ({ productId: body.productId, name: body.name }));
};

export const removeProductLink = async (req, res) => {
  req.method = 'DELETE';
  await handleArrayOperation(req, res, 'products', 'Product link', null);
};

// ==================== SERVICE LINKS ====================
export const addServiceLink = async (req, res) => {
  await handleArrayOperation(req, res, 'services', 'Service link', (body) => ({ name: body.name }));
};

export const removeServiceLink = async (req, res) => {
  req.method = 'DELETE';
  await handleArrayOperation(req, res, 'services', 'Service link', null);
};