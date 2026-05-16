import mongoose from 'mongoose';

// Social Media Links Schema
const socialMediaSchema = new mongoose.Schema({
  facebook: { type: String, default: '', trim: true },
  instagram: { type: String, default: '', trim: true },
  twitter: { type: String, default: '', trim: true },
  youtube: { type: String, default: '', trim: true },
  linkedin: { type: String, default: '', trim: true }
});

// Company Contact Schema
const companyContactSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  }
});

// Product Link Schema
const productLinkSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  }
});

// Service Link Schema
const serviceLinkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  }
});

// Policy Document Schema
const policySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Policy title is required'],
    trim: true
  },
  file: {
    type: String,
    required: [true, 'Policy file is required']
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Main Footer Schema
const footerSchema = new mongoose.Schema({
  companyDescription: {
    type: String,
    required: [true, 'Company description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  companyContact: companyContactSchema,
  socialMedia: socialMediaSchema,
  products: [productLinkSchema],
  services: [serviceLinkSchema],
  privacyPolicy: policySchema,
  cookiePolicy: policySchema,
  termsOfService: policySchema,
  copyrightText: {
    type: String,
    default: `© ${new Date().getFullYear()} SmartLabTech. All rights reserved.`,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Footer = mongoose.model('Footer', footerSchema);
export default Footer;