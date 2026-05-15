import mongoose from 'mongoose';

// Hero Section Schema (Array of objects)
const heroItemSchema = new mongoose.Schema({
  image: { type: String, required: true },
  title: { type: String, required: true },
  tag: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
});

// About Section Schema
const aboutPointSchema = new mongoose.Schema({ point: { type: String, required: true } });
const aboutSchema = new mongoose.Schema({
  image: { type: String, required: true },
  tag: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  points: [aboutPointSchema],
  buttonText: { type: String, default: 'Read More' },
  isActive: { type: Boolean, default: true }
});

// Achievements Section Schema
const achievementsSchema = new mongoose.Schema({
  yearsOfExperience: { type: Number, required: true, default: 0 },
  productsDelivered: { type: Number, required: true, default: 0 },
  clientSatisfaction: { type: String, required: true },
  quote: { type: String, required: true },
  images: [{ type: String }]
});

// Testimonial Item Schema
const testimonialItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
  image: { type: String, required: true },
  role: { type: String, required: true },
  review: { type: String, required: true },
  isActive: { type: Boolean, default: true }
});

// Testimonials Section Schema
const testimonialsSchema = new mongoose.Schema({
  tag: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  testimonials: [testimonialItemSchema],
  isActive: { type: Boolean, default: true }
});

// Main Home Page Schema
const homePageSchema = new mongoose.Schema({
  hero: [heroItemSchema],  // Changed to array
  about: aboutSchema,
  achievements: achievementsSchema,
  testimonials: testimonialsSchema,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const HomePage = mongoose.model('HomePage', homePageSchema);
export default HomePage;