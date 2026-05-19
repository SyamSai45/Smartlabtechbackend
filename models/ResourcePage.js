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
    required: [true, 'Hero tag is required'],
    trim: true
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

// ==================== ARTICLE SECTION ====================
const articleItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Article title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Article tag is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Article description is required'],
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Article image is required']
  },
  duration: {
    type: String,
    required: [true, 'Article duration is required'],
    trim: true,
    default: '5 min read'
  },
  link: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const articleSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Article section title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Article section tag is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  articles: [articleItemSchema],
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== PDF SECTION ====================
const pdfItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'PDF name is required'],
    trim: true
  },
  file: {
    type: String,
    required: [true, 'PDF file is required']
  },
  size: {
    type: String,
    default: ''
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

const pdfSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'PDF section title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'PDF section tag is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  pdfs: [pdfItemSchema],
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== CASE STUDY SECTION ====================
const caseStudyItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Case study title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Case study tag is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Case study description is required'],
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Case study image is required']
  },
  link: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const caseStudySectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Case study section title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Case study section tag is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  caseStudies: [caseStudyItemSchema],
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

const faqSectionSchema = new mongoose.Schema({
  tag: {
    type: String,
    required: [true, 'FAQ section tag is required'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'FAQ section title is required'],
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

// ==================== ACHIEVEMENTS SECTION ====================
const achievementItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Achievement title is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const achievementsSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Achievements section title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Achievements section tag is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  achievements: [achievementItemSchema],
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== CTA SECTION ====================
const ctaSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'CTA title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'CTA description is required'],
    trim: true
  },
  buttonText: {
    type: String,
    required: [true, 'CTA button text is required'],
    default: 'Learn More',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== MAIN RESOURCE PAGE SCHEMA ====================
const resourcePageSchema = new mongoose.Schema({
  hero: heroSchema,
  articles: articleSectionSchema,
  pdfs: pdfSectionSchema,
  caseStudies: caseStudySectionSchema,
  faqs: faqSectionSchema,
  achievements: achievementsSectionSchema,
  cta: ctaSectionSchema,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const ResourcePage = mongoose.model('ResourcePage', resourcePageSchema);
export default ResourcePage;