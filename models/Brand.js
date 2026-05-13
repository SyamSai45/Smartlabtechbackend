import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    unique: true,
    trim: true
  },
  logo: {
    type: String,
    required: [true, 'Brand logo is required']
  },
  description: {
    type: String,
    required: [true, 'Brand description is required'],
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Brand = mongoose.model('Brand', brandSchema);
export default Brand;