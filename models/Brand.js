import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
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
  founded: {
    type: Number,
    default: null
  },
  headquarters: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Create slug before saving
brandSchema.pre('save', function(next) {
  if (this.name && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  next();
});

const Brand = mongoose.model('Brand', brandSchema);
export default Brand;