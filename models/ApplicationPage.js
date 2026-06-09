// models/ApplicationPage.js
import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true }
}, { timestamps: true });

const heroSchema = new mongoose.Schema({
  title: { type: String, required: true },
  tag: { type: String },
  metaTag: { type: String },
  description: { type: String, required: true },
  buttonText: { type: String, default: 'Get Started' },
  image: { type: String, required: true }
}, { timestamps: true });

const servicesSchema = new mongoose.Schema({
  tag: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  cards: [cardSchema]
}, { timestamps: true });

const ctaSchema = new mongoose.Schema({
  tag: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  buttonText: { type: String, default: 'Learn More' }
}, { timestamps: true });

// Separate models for each section
export const Hero = mongoose.model('Hero', heroSchema);
export const MainCard = mongoose.model('MainCard', cardSchema);
export const Services = mongoose.model('Services', servicesSchema);
export const ServiceCard = mongoose.model('ServiceCard', cardSchema);
export const CTA = mongoose.model('CTA', ctaSchema);