import mongoose from 'mongoose';

const highlightSchema = new mongoose.Schema({
  icon: { type: String, default: 'zap' },
  label: { type: String, required: true },
  desc: { type: String, required: true }
}, { _id: true });

const faqSchema = new mongoose.Schema({
  q: { type: String, required: true },
  a: { type: String, required: true }
}, { _id: true });

const productSchema = new mongoose.Schema({
  // Basic Information
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  
  // Relationships
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, 'Brand is required']
  },
  brandName: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  categoryName: {
    type: String,
    required: true
  },
  
  // Content
  shortDesc: {
    type: String,
    required: [true, 'Short description is required']
  },
  fullDesc: {
    type: String,
    required: [true, 'Full description is required']
  },
  
  // Media
  mainImage: {
    type: String,
    required: [true, 'Main image is required']
  },
  mainImageThumb: {
    type: String
  },
  gallery: [{
    type: String
  }],
  galleryThumbs: [{
    type: String
  }],
  
  // Specifications - flexible object
  specifications: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Features - array of strings
  features: [{
    type: String
  }],
  
  // Applications - array of strings
  applications: [{
    type: String
  }],
  
  // FAQs - array of objects
  faqs: [faqSchema],
  
  // Highlights - array of objects
  highlights: [highlightSchema],
  
  // Business Information
  warranty: {
    type: String,
    default: 'Standard warranty applies'
  },
  leadTime: {
    type: String,
    default: '2–3 weeks'
  },
  inStock: {
    type: Boolean,
    default: true
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Price is required'],
    default: 0
  },
  discountedPrice: {
    type: Number,
    default: null
  },
  
  // SEO & Ratings
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviews: {
    type: Number,
    default: 0
  },
  
  // Certifications - array of strings
  certifications: [{
    type: String
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String]
}, { timestamps: true });

// Create slug before saving
productSchema.pre('save', function(next) {
  if (this.name && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  next();
});

// Index for search
productSchema.index({ name: 'text', shortDesc: 'text', fullDesc: 'text', sku: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;