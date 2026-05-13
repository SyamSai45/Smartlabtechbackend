import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get relative path from absolute path
const getRelativePath = (absolutePath) => {
  // Convert Windows backslashes to forward slashes
  const normalizedPath = absolutePath.replace(/\\/g, '/');
  // Find 'uploads' in the path and get everything from there
  const uploadsIndex = normalizedPath.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    return normalizedPath.substring(uploadsIndex);
  }
  // Fallback: try to find 'uploads' without leading slash
  const uploadsIndex2 = normalizedPath.indexOf('uploads/');
  if (uploadsIndex2 !== -1) {
    return '/' + normalizedPath.substring(uploadsIndex2);
  }
  console.log('⚠️ Could not find uploads in path:', normalizedPath);
  return normalizedPath;
};

// Process and save image, return relative URL path
const processAndSaveImage = async (inputPath, outputFilename, options = {}) => {
  try {
    const { width = 1200, height = null, quality = 85, fit = 'inside' } = options;
    const dir = path.dirname(inputPath);
    const outputPath = path.join(dir, outputFilename);
    
    console.log(`📝 Processing: ${path.basename(inputPath)} -> ${outputFilename}`);
    
    let sharpInstance = sharp(inputPath);
    
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: fit,
        withoutEnlargement: true
      });
    }
    
    await sharpInstance.jpeg({ quality, progressive: true }).toFile(outputPath);
    console.log(`✅ Image saved: ${outputFilename}`);
    
    // Delete original file after processing
    if (fs.existsSync(inputPath) && inputPath !== outputPath) {
      fs.unlinkSync(inputPath);
      console.log(`🗑️ Deleted original: ${path.basename(inputPath)}`);
    }
    
    // Return relative URL path (not Windows path)
    const relativePath = getRelativePath(outputPath);
    console.log(`📎 Relative path: ${relativePath}`);
    return relativePath;
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
    
    await sharp(inputPath)
      .resize(200, 200, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png({ quality: 90 })
      .toFile(outputPath);
    
    console.log(`✅ Brand logo saved: ${outputFilename}`);
    
    // Delete original file
    if (fs.existsSync(inputPath) && inputPath !== outputPath) {
      fs.unlinkSync(inputPath);
    }
    
    // Return relative URL path
    const relativePath = getRelativePath(outputPath);
    console.log(`📎 Logo URL path: ${relativePath}`);
    return relativePath;
  } catch (error) {
    console.error('Brand logo processing error:', error.message);
    return null;
  }
};

// Process main image
export const processMainImage = async (inputPath) => {
  const parsedPath = path.parse(inputPath);
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

// Create thumbnail
export const createThumbnail = async (inputPath) => {
  try {
    if (!fs.existsSync(inputPath)) return null;
    
    const dir = path.dirname(inputPath);
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const thumbFilename = `thumb-${timestamp}-${random}.jpg`;
    const thumbPath = path.join(dir, thumbFilename);
    
    await sharp(inputPath)
      .resize(300, 300, {
        fit: 'cover',
        position: 'centre'
      })
      .jpeg({ quality: 70 })
      .toFile(thumbPath);
    
    console.log(`✅ Thumbnail created: ${thumbFilename}`);
    
    // Return relative URL path
    const relativePath = getRelativePath(thumbPath);
    return relativePath;
  } catch (error) {
    console.error('Thumbnail creation error:', error.message);
    return null;
  }
};

export const processThumbnail = createThumbnail;