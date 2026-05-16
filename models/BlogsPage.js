import mongoose from 'mongoose';

// ==================== BLOG HERO SECTION ====================
const blogHeroSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog hero title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Blog hero tag is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Blog hero description is required'],
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Blog hero image is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== AUTHOR SCHEMA ====================
const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Author image is required']
  },
  role: {
    type: String,
    required: [true, 'Author role is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== BLOG SCHEMA ====================
const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    unique: true,
    trim: true,
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  bgImage: {
    type: String,
    required: [true, 'Background image is required']
  },
  mainImage: {
    type: String,
    required: [true, 'Main image is required']
  },
  duration: {
    type: String,
    required: [true, 'Read duration is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Blog date is required'],
    default: Date.now
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },
  author: authorSchema,
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    trim: true,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  longDescription: {
    type: String,
    required: [true, 'Long description is required'],
    trim: true
  },
  quote: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true,
    index: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Generate slug before saving
blogSchema.pre('save', function(next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// ==================== MAIN BLOGS PAGE SCHEMA ====================
const blogsPageSchema = new mongoose.Schema({
  blogHero: blogHeroSchema,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Create models
const Blog = mongoose.model('Blog', blogSchema);
const BlogsPage = mongoose.model('BlogsPage', blogsPageSchema);

export { Blog, BlogsPage };