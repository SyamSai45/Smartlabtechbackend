import mongoose from 'mongoose';

// Hero Section Schema
const heroSchema = new mongoose.Schema({
  image: {
    type: String,
    required: [true, 'Hero image is required']
  },
  title: {
    type: String,
    required: [true, 'Hero title is required'],
    trim: true
  },
  tag: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// About Section - Points Schema
const aboutPointSchema = new mongoose.Schema({
  point: {
    type: String,
    required: true,
    trim: true
  }
});

// About Section Schema
const aboutSchema = new mongoose.Schema({
  image: {
    type: String,
    required: [true, 'About section image is required']
  },
  tag: {
    type: String,
    required: [true, 'About section tag is required'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'About section title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'About section description is required'],
    trim: true
  },
  points: [aboutPointSchema],
  buttonText: {
    type: String,
    default: 'Read More'
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Achievements Section Schema
const achievementsSchema = new mongoose.Schema({
  yearsOfExperience: {
    type: Number,
    required: [true, 'Years of experience is required'],
    default: 0
  },
  productsDelivered: {
    type: Number,
    required: [true, 'Products delivered is required'],
    default: 0
  },
  clientSatisfaction: {
    type: String,  // Fixed: Changed from 'number' to 'String'
    required: [true, 'Client satisfaction is required'],
    trim: true
  },
  quote: {
    type: String,
    required: [true, 'Quote is required'],
    trim: true
  },
  images: [{
    type: String
  }]
  // Removed isActive as per your schema
});

// Testimonial Item Schema
const testimonialItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Testimonial name is required'],
    trim: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5,
    default: 5
  },
  image: {
    type: String,
    required: [true, 'Testimonial image is required']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true
  },
  review: {
    type: String,
    required: [true, 'Review is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Testimonials Section Schema
const testimonialsSchema = new mongoose.Schema({
  tag: {
    type: String,
    required: [true, 'Testimonials tag is required'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Testimonials title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Testimonials description is required'],
    trim: true
  },
  testimonials: [testimonialItemSchema],
  isActive: {
    type: Boolean,
    default: true
  }
});

// Main Home Page Schema
const homePageSchema = new mongoose.Schema({
  hero: heroSchema,
  about: aboutSchema,
  achievements: achievementsSchema,
  testimonials: testimonialsSchema,
  isActive: {
    type: Boolean,  
    default: true
  }
}, { timestamps: true });

const HomePage = mongoose.model('HomePage', homePageSchema);
export default HomePage; 