import mongoose from 'mongoose';

// ==================== SUPPORT HERO SECTION ====================
const supportHeroSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Support hero title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Support hero tag is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Support hero description is required'],
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Support hero image is required']
  },
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
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== SUPPORT CARDS SECTION (Array) ====================
const supportCardItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Card title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Card description is required'],
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

// Support Cards is now an array of card items
const supportCardsSchema = new mongoose.Schema({
  cards: [supportCardItemSchema],
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== SUPPORT SOLUTIONS SECTION ====================
const solutionCardItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Solution card title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Solution card description is required'],
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

const supportSolutionsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Solutions section title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Solutions section tag is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  cards: [solutionCardItemSchema],
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== SUPPORT LIFE CYCLE SECTION ====================
const supportLifeCycleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Life cycle section title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Life cycle section tag is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Life cycle section description is required'],
    trim: true
  },
  points: [{
    point: {
      type: String,
      required: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  metaTitle: {
    type: String,
    default: ''
  },
  metaDescription: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== FAQ SECTION ====================
const faqItemSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'FAQ question is required'],
    trim: true
  },
  answer: {
    type: String,
    required: [true, 'FAQ answer is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const supportFaqSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'FAQ section title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'FAQ section tag is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  faqs: [faqItemSchema],
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== SUPPORT CTA SECTION ====================
const supportCtaSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: [true, 'CTA email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  phoneNumber: {
    type: String,
    required: [true, 'CTA phone number is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== MAIN SUPPORT PAGE SCHEMA ====================
const supportPageSchema = new mongoose.Schema({
  supportHero: supportHeroSchema,
  supportCards: [supportCardItemSchema],  // Array of card objects directly
  supportSolutions: supportSolutionsSchema,
  supportLifeCycle: supportLifeCycleSchema,
  supportFaq: supportFaqSchema,
  supportCta: supportCtaSchema,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const SupportPage = mongoose.model('SupportPage', supportPageSchema);
export default SupportPage;