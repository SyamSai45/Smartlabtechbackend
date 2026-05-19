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

// ==================== POPUP SECTION (SIMPLE - ONLY IMAGE) ====================
const popupSchema = new mongoose.Schema({
  image: {
    type: String,
    default: null
  },
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
  popup: popupSchema,  
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// ==================== SERVICE FORM SCHEMA ====================
const serviceFormSchema = new mongoose.Schema({
  companyDetails: {
    type: String,
    required: [true, 'Company details are required'],
    trim: true
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  contactPerson: {
    type: String,
    required: [true, 'Contact person name is required'],
    trim: true
  },
  designation: {
    type: String,
    required: [true, 'Designation/Department is required'],
    trim: true
  },
  contactNo: {
    type: String,
    required: [true, 'Contact number is required'],
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
  instrumentType: {
    type: String,
    required: [true, 'Instrument/Equipment type is required'],
    trim: true
  },
  modelNo: {
    type: String,
    required: [true, 'Model number is required'],
    trim: true
  },
  serialNo: {
    type: String,
    required: [true, 'Serial number is required'],
    trim: true
  },
  natureOfProblem: {
    type: String,
    required: [true, 'Nature of problem is required'],
    trim: true
  },
  contractType: {
    type: String,
    required: [true, 'Contract type is required'],
    trim: true
  },
  poNumber: {
    type: String,
    required: [true, 'PO number is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'resolved', 'closed', 'cancelled'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const ServicesPage = mongoose.model('ServicesPage', servicesPageSchema);
const ServiceForm = mongoose.model('ServiceForm', serviceFormSchema);

export { ServicesPage, ServiceForm };