import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get relative path from absolute path
const getRelativePath = (absolutePath) => {
  const normalizedPath = absolutePath.replace(/\\/g, '/');
  const uploadsIndex = normalizedPath.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    return normalizedPath.substring(uploadsIndex);
  }
  const uploadsIndex2 = normalizedPath.indexOf('uploads/');
  if (uploadsIndex2 !== -1) {
    return '/' + normalizedPath.substring(uploadsIndex2);
  }
  return normalizedPath;
};

// Process and save image, return relative URL path
const processAndSaveImage = async (inputPath, outputFilename, options = {}) => {
  try {
    const { width = 1200, height = null, quality = 85, fit = 'inside' } = options;
    const dir = path.dirname(inputPath);
    const outputPath = path.join(dir, outputFilename);
    
    let sharpInstance = sharp(inputPath);
    
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: fit,
        withoutEnlargement: true
      });
    }
    
    await sharpInstance.jpeg({ quality, progressive: true }).toFile(outputPath);
    
    // Delete original file
    if (fs.existsSync(inputPath) && inputPath !== outputPath) {
      fs.unlinkSync(inputPath);
    }
    
    return getRelativePath(outputPath);
  } catch (error) {
    console.error('Image processing error:', error.message);
    return null;
  }
};

// Process brand logo
export const processBrandLogo = async (inputPath) => {
  try {
    if (!fs.existsSync(inputPath)) return null;
    
    const dir = path.dirname(inputPath);
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const outputFilename = `logo-${timestamp}-${random}.png`;
    const outputPath = path.join(dir, outputFilename);
    
    // Make sure sharp is imported and working
    const sharpModule = sharp;
    
    await sharpModule(inputPath)
      .resize(200, 200, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png({ quality: 90 })
      .toFile(outputPath);
    
    console.log(`✅ Brand logo saved: ${outputFilename}`);
    
    if (fs.existsSync(inputPath) && inputPath !== outputPath) {
      fs.unlinkSync(inputPath);
    }
    
    return getRelativePath(outputPath);
  } catch (error) {
    console.error('Brand logo processing error:', error.message);
    return null;
  }
};

// Process main image
export const processMainImage = async (inputPath) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const outputFilename = `main-${timestamp}-${random}.jpg`;
  
  return await processAndSaveImage(inputPath, outputFilename, {
    width: 1200,
    quality: 85
  });
};

// Process gallery image
export const processGalleryImage = async (inputPath) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const outputFilename = `gallery-${timestamp}-${random}.jpg`;
  
  return await processAndSaveImage(inputPath, outputFilename, {
    width: 800,
    quality: 80
  });
};