import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Process single image
const processImage = async (inputPath, options = {}) => {
  try {
    const {
      width = 1200,
      height = null,
      quality = 85,
      format = 'jpeg',
      fit = 'inside'
    } = options;

    const ext = path.extname(inputPath);
    const outputPath = inputPath.replace(ext, `-optimized${ext === '.png' ? '.png' : '.jpg'}`);
    
    let sharpInstance = sharp(inputPath);
    
    // Resize if dimensions provided
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: fit,
        withoutEnlargement: true
      });
    }
    
    // Convert format if needed
    if (format === 'webp') {
      await sharpInstance.webp({ quality }).toFile(outputPath);
    } else if (format === 'png') {
      await sharpInstance.png({ quality }).toFile(outputPath);
    } else {
      await sharpInstance.jpeg({ quality, progressive: true }).toFile(outputPath);
    }
    
    // Delete original file
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }
    
    return outputPath;
  } catch (error) {
    console.error('Image processing error:', error);
    return inputPath;
  }
};

// Process brand logo (small, square, transparent background)
const processBrandLogo = async (inputPath) => {
  try {
    const ext = path.extname(inputPath);
    const outputPath = inputPath.replace(ext, '-optimized.png');
    
    await sharp(inputPath)
      .resize(200, 200, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png({ quality: 90 })
      .toFile(outputPath);
    
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }
    
    return outputPath;
  } catch (error) {
    console.error('Brand logo processing error:', error);
    return inputPath;
  }
};

// Process product main image (large, high quality)
const processMainImage = async (inputPath) => {
  return await processImage(inputPath, {
    width: 1200,
    quality: 85,
    format: 'jpeg'
  });
};

// Process gallery image (medium, good quality)
const processGalleryImage = async (inputPath) => {
  return await processImage(inputPath, {
    width: 800,
    quality: 80,
    format: 'jpeg'
  });
};

// Process thumbnail (small, fast loading)
const processThumbnail = async (inputPath) => {
  return await processImage(inputPath, {
    width: 300,
    quality: 70,
    format: 'jpeg'
  });
};

export {
  processImage,
  processBrandLogo,
  processMainImage,
  processGalleryImage,
  processThumbnail
};