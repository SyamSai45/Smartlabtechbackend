// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Set upload root directory (absolute path)
// const UPLOAD_ROOT = path.join(__dirname, '../uploads');

// // Ensure directory exists
// const ensureDir = (dir) => {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//     console.log(`📁 Created directory: ${dir}`);
//   }
// };

// // Configure storage with absolute paths
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     let uploadPath = UPLOAD_ROOT;
    
//     if (file.fieldname === 'logo') {
//       uploadPath = path.join(UPLOAD_ROOT, 'brands');
//     } else if (file.fieldname === 'mainImage') {
//       uploadPath = path.join(UPLOAD_ROOT, 'products', 'main');
//     } else if (file.fieldname === 'gallery') {
//       uploadPath = path.join(UPLOAD_ROOT, 'products', 'gallery');
//     }
    
//     ensureDir(uploadPath);
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     // Generate unique filename
//     const timestamp = Date.now();
//     const random = Math.round(Math.random() * 1E9);
//     const ext = path.extname(file.originalname);
//     const filename = `${file.fieldname}-${timestamp}-${random}${ext}`;
//     cb(null, filename);
//   }
// });

// // File filter for images only
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|gif|webp/;
//   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = allowedTypes.test(file.mimetype);

//   if (mimetype && extname) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
//   }
// };

// // Create multer instance
// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024 // 10MB
//   },
//   fileFilter: fileFilter
// });

// // Specific upload configurations
// const uploadBrandLogo = upload.single('logo');
// const uploadProductImages = upload.fields([
//   { name: 'mainImage', maxCount: 1 },
//   { name: 'gallery', maxCount: 10 }
// ]);

// export {
//   upload,
//   uploadBrandLogo,
//   uploadProductImages,
//   UPLOAD_ROOT
// };


// config/multer.config.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set upload root directory (absolute path)
const UPLOAD_ROOT = path.join(__dirname, '../uploads');

// Ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
};

// Configure storage with absolute paths
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = UPLOAD_ROOT;
    
    // Brand routes
    if (file.fieldname === 'logo') {
      uploadPath = path.join(UPLOAD_ROOT, 'brands');
    }
    // Product routes
    else if (file.fieldname === 'mainImage') {
      uploadPath = path.join(UPLOAD_ROOT, 'products', 'main');
    }
    else if (file.fieldname === 'gallery') {
      uploadPath = path.join(UPLOAD_ROOT, 'products', 'gallery');
    }
    // Hero section for application pages
    else if (file.fieldname === 'heroImage') {
      uploadPath = path.join(UPLOAD_ROOT, 'application-pages', 'hero');
    }
    // Hero section for homepage
    else if (file.fieldname === 'heroBackground') {
      uploadPath = path.join(UPLOAD_ROOT, 'homepage', 'hero');
    }
    else if (file.fieldname === 'heroImage') {
      uploadPath = path.join(UPLOAD_ROOT, 'homepage', 'hero');
    }
    // Default
    else {
      uploadPath = path.join(UPLOAD_ROOT, 'temp');
    }
    
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${timestamp}-${random}${ext}`;
    cb(null, filename);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)'));
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

// Specific upload configurations
const uploadBrandLogo = upload.single('logo');
const uploadProductImages = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]);

// Application Pages - Hero section image
const uploadHeroImage = upload.single('heroImage');

// Homepage hero image
const uploadHomeHeroImage = upload.single('heroImage');

export {
  upload,
  uploadBrandLogo,
  uploadProductImages,
  uploadHeroImage,
  uploadHomeHeroImage,
  UPLOAD_ROOT
};