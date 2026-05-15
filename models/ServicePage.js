import mongoose from 'mongoose';

// ==================== SERVICE HOME SECTION ====================
const serviceHomeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Service home title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Service home tag is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Service home description is required'],
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Service home image is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== SERVICE HERO SECTION ====================
const serviceHeroSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Service hero title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Service hero tag is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Service hero description is required'],
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
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== SERVICE CATALOGUE SECTION ====================
const catalogueCardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Catalogue card title is required'],
    trim: true
  },
  icon: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: [true, 'Catalogue card description is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const serviceCatalogueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Service catalogue title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Service catalogue tag is required'],
    trim: true
  },
 
  cards: [catalogueCardSchema],
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== SERVICE SUPPORT SECTION ====================
const serviceSupportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Service support title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: [true, 'Service support tag is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Service support description is required'],
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
  
  isActive: {
    type: Boolean,
    default: true
  }
});

// ==================== MAIN SERVICES PAGE SCHEMA ====================
const servicesPageSchema = new mongoose.Schema({
  serviceHome: serviceHomeSchema,
  serviceHero: serviceHeroSchema,
  serviceCatalogue: serviceCatalogueSchema,
  serviceSupport: serviceSupportSchema,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const ServicesPage = mongoose.model('ServicesPage', servicesPageSchema);
export default ServicesPage;  