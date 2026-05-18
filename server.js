import express from 'express';
import dns from 'dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import connectDB from './config/database.js';
import brandRoutes from './routes/brand.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import contactRoutes from './routes/contact.routes.js';
import contactInfoRoutes from './routes/contactinfo.routes.js';
import homePageRoutes from './routes/homepage.routes.js';
import aboutPageRoutes from './routes/aboutpage.routes.js';
import servicePageRoutes from './routes/servicepage.routes.js';
import supportPageRoutes from './routes/supportpage.routes.js';
import quoteRoutes from './routes/quote.routes.js';
import blogPageRoutes from './routes/blogpage.routes.js';
import footerRoutes from './routes/footer.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import errorHandler from './middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dns.setDefaultResultOrder("ipv4first");

dotenv.config();

// Create upload directories on server start
const createUploadDirs = () => {
  const dirs = [
    // Root uploads
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads', 'temp'),
    
    // Brand directories
    path.join(__dirname, 'uploads', 'brands'),
    
    // Product directories
    path.join(__dirname, 'uploads', 'products'),
    path.join(__dirname, 'uploads', 'products', 'main'),
    path.join(__dirname, 'uploads', 'products', 'gallery'),
    
    // Homepage directories
    path.join(__dirname, 'uploads', 'homepage'),
    path.join(__dirname, 'uploads', 'homepage', 'hero'),
    path.join(__dirname, 'uploads', 'homepage', 'about'),
    path.join(__dirname, 'uploads', 'homepage', 'achievements'),
    path.join(__dirname, 'uploads', 'homepage', 'testimonials'),
    
    // About page directories
    path.join(__dirname, 'uploads', 'aboutpage'),
    path.join(__dirname, 'uploads', 'aboutpage', 'hero'),
    path.join(__dirname, 'uploads', 'aboutpage', 'about'),
    path.join(__dirname, 'uploads', 'aboutpage', 'cards'),
    path.join(__dirname, 'uploads', 'aboutpage', 'whychoose'),
    
    // Services page directories
    path.join(__dirname, 'uploads', 'servicespage'),
    path.join(__dirname, 'uploads', 'servicespage', 'servicehome'),
    path.join(__dirname, 'uploads', 'servicespage', 'servicehero'),
    path.join(__dirname, 'uploads', 'servicespage', 'servicecatalogue'),
    path.join(__dirname, 'uploads', 'servicespage', 'servicesupport'),
    
    // Support page directories
    path.join(__dirname, 'uploads', 'supportpage'),
    path.join(__dirname, 'uploads', 'supportpage', 'hero'),
    path.join(__dirname, 'uploads', 'supportpage', 'cards'),
    path.join(__dirname, 'uploads', 'supportpage', 'solutions'),
    path.join(__dirname, 'uploads', 'supportpage', 'lifecycle'),
    path.join(__dirname, 'uploads', 'supportpage', 'faq'),
    path.join(__dirname, 'uploads', 'supportpage', 'cta'),

    // Blog page directories
    path.join(__dirname, 'uploads', 'blogpage'),
    path.join(__dirname, 'uploads', 'blogpage', 'hero'),
    path.join(__dirname, 'uploads', 'blogpage', 'blogs'),
    path.join(__dirname, 'uploads', 'blogpage', 'authors'),

    // CONTACT page directories
    path.join(__dirname, 'uploads', 'contactpage'),
    path.join(__dirname, 'uploads', 'contactpage', 'hero'),
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Call before starting server
createUploadDirs();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log(`📁 Static files served from: ${path.join(__dirname, 'uploads')}`);

// Routes
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/contact-info', contactInfoRoutes);
app.use('/api/homepage', homePageRoutes);
app.use('/api/aboutpage', aboutPageRoutes);
app.use('/api/servicepage', servicePageRoutes);
app.use('/api/supportpage', supportPageRoutes); 
app.use('/api/quotes', quoteRoutes);
app.use('/api/blogs', blogPageRoutes);
app.use('/api/footer', footerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes); 

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date() });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5101;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});