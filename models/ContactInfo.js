import mongoose from 'mongoose';

// Address Schema
const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: [true, 'Street address is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    default: 'India',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Main Contact Info Schema
const contactInfoSchema = new mongoose.Schema({
  phones: [{
    type: String,
    required: true,
    trim: true
  }],
  emails: [{
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  }],
  address: [addressSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const ContactInfo = mongoose.model('ContactInfo', contactInfoSchema);
export default ContactInfo;