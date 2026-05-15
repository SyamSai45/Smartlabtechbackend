import mongoose from 'mongoose';

// ==================== HERO SECTION ====================
const heroSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Hero title is required'],
    trim: true
  },
  tag: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: [true, 'Hero description is required'],
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Hero image is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== ABOUT SECTION ====================
const aboutSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'About title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'About tag is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'About description is required'],
    trim: true
  },
  bgImage: {
    type: String,
    required: [true, 'Background image is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
});



const cardsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Cards section title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Cards section tag is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Cards section description is required'],
    trim: true
  },
  
});

// ==================== CORE VALUES SECTION ====================
const coreValueItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Core value title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Core value description is required'],
    trim: true
  },
  icon: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const coreValuesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Core values title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Core values tag is required'],
    trim: true
  },

  values: [coreValueItemSchema],
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== WHY CHOOSE US SECTION ====================
const whyChoosePointSchema = new mongoose.Schema({
  point: {
    type: String,
    required: [true, 'Point is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const whyChooseUsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Why choose us title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Why choose us tag is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Why choose us description is required'],
    trim: true
  },
  points: [whyChoosePointSchema],
  image: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== CTA SECTION ====================
const ctaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'CTA title is required'],
    trim: true
  },
  tag: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: [true, 'CTA description is required'],
    trim: true
  },

  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== MAIN ABOUT PAGE SCHEMA ====================
const aboutPageSchema = new mongoose.Schema({
  hero: heroSchema,
  about: aboutSchema,
  cards: [cardsSchema],
  coreValues: coreValuesSchema,
  whyChooseUs: whyChooseUsSchema,
  cta: ctaSchema,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const AboutPage = mongoose.model('AboutPage', aboutPageSchema);
export default AboutPage;


