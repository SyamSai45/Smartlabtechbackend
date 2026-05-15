import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  
  // Company Information
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City name cannot exceed 100 characters']
  },
  
  // Product Selection
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  categoryName: {
    type: String,
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  productName: {
    type: String,
    required: true
  },
  
  // Requirement Details
  usage: {
    type: String,
    required: [true, 'Usage/purpose is required'],
    trim: true,
    minlength: [5, 'Please provide more details about usage'],
    maxlength: [500, 'Usage description cannot exceed 500 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [10000, 'Quantity cannot exceed 10000']
  },
  
  // Quote Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'quoted', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  
  // Tracking
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Quote = mongoose.model('Quote', quoteSchema);
export default Quote;