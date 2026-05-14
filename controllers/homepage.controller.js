import HomePage from '../models/HomePage.js';

// ==================== GET HOME PAGE (PUBLIC) ====================

// @desc    Get home page content (Public)
// @route   GET /api/homepage
export const getHomePage = async (req, res) => {
  try {
    let homePage = await HomePage.findOne({ isActive: true });
    
    if (!homePage) {
      return res.status(404).json({
        success: false,
        message: 'Home page content not found'
      });
    }

    res.json({
      success: true,
      data: homePage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CREATE HOME PAGE (ADMIN) ====================

// @desc    Create home page content (Admin)
// @route   POST /api/homepage
export const createHomePage = async (req, res) => {
  try {
    const { hero, about, achievements, testimonials } = req.body;

    // Check if home page already exists
    const existingHomePage = await HomePage.findOne();
    if (existingHomePage) {
      return res.status(400).json({
        success: false,
        message: 'Home page already exists. Use PUT to update.'
      });
    }

    const homePage = await HomePage.create({
      hero,
      about,
      achievements,
      testimonials,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Home page created successfully',
      data: homePage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== UPDATE HOME PAGE (ADMIN) ====================

// @desc    Update home page content (Admin)
// @route   PUT /api/homepage
export const updateHomePage = async (req, res) => {
  try {
    const { hero, about, achievements, testimonials } = req.body;

    let homePage = await HomePage.findOne();
    
    if (!homePage) {
      return res.status(404).json({
        success: false,
        message: 'Home page not found. Please create first using POST.'
      });
    }

    // Update sections if provided
    if (hero) homePage.hero = hero;
    if (about) homePage.about = about;
    if (achievements) homePage.achievements = achievements;
    if (testimonials) homePage.testimonials = testimonials;
    
    await homePage.save();

    res.json({
      success: true,
      message: 'Home page updated successfully',
      data: homePage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== DELETE HOME PAGE (ADMIN) ====================

// @desc    Delete home page content (Admin)
// @route   DELETE /api/homepage
export const deleteHomePage = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    
    if (!homePage) {
      return res.status(404).json({
        success: false,
        message: 'Home page not found'
      });
    }

    await HomePage.deleteMany({});

    res.json({
      success: true,
      message: 'Home page deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== UPDATE SPECIFIC SECTION (ADMIN) ====================

// @desc    Update only hero section
// @route   PUT /api/homepage/hero
export const updateHeroSection = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    
    if (!homePage) {
      return res.status(404).json({
        success: false,
        message: 'Home page not found'
      });
    }

    homePage.hero = req.body;
    await homePage.save();

    res.json({
      success: true,
      message: 'Hero section updated successfully',
      data: homePage.hero
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update only about section
// @route   PUT /api/homepage/about
export const updateAboutSection = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    
    if (!homePage) {
      return res.status(404).json({
        success: false,
        message: 'Home page not found'
      });
    }

    homePage.about = req.body;
    await homePage.save();

    res.json({
      success: true,
      message: 'About section updated successfully',
      data: homePage.about
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update only achievements section
// @route   PUT /api/homepage/achievements
export const updateAchievementsSection = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    
    if (!homePage) {
      return res.status(404).json({
        success: false,
        message: 'Home page not found'
      });
    }

    homePage.achievements = req.body;
    await homePage.save();

    res.json({
      success: true,
      message: 'Achievements section updated successfully',
      data: homePage.achievements
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update only testimonials section
// @route   PUT /api/homepage/testimonials
export const updateTestimonialsSection = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();
    
    if (!homePage) {
      return res.status(404).json({
        success: false,
        message: 'Home page not found'
      });
    }

    homePage.testimonials = req.body;
    await homePage.save();

    res.json({
      success: true,
      message: 'Testimonials section updated successfully',
      data: homePage.testimonials
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ADD/REMOVE TESTIMONIAL (ADMIN) ====================

// @desc    Add testimonial to testimonials section
// @route   POST /api/homepage/testimonials/add
export const addTestimonial = async (req, res) => {
  try {
    const { name, rating, image, role, review } = req.body;

    const homePage = await HomePage.findOne();
    
    if (!homePage) {
      return res.status(404).json({
        success: false,
        message: 'Home page not found'
      });
    }

    homePage.testimonials.testimonials.push({
      name,
      rating,
      image,
      role,
      review,
      isActive: true
    });
    
    await homePage.save();

    res.status(201).json({
      success: true,
      message: 'Testimonial added successfully',
      data: homePage.testimonials.testimonials
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove testimonial from testimonials section
// @route   DELETE /api/homepage/testimonials/:index
export const removeTestimonial = async (req, res) => {
  try {
    const { index } = req.params;

    const homePage = await HomePage.findOne();
    
    if (!homePage) {
      return res.status(404).json({
        success: false,
        message: 'Home page not found'
      });
    }

    if (index < 0 || index >= homePage.testimonials.testimonials.length) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found at this index'
      });
    }

    homePage.testimonials.testimonials.splice(index, 1);
    await homePage.save();

    res.json({
      success: true,
      message: 'Testimonial removed successfully',
      data: homePage.testimonials.testimonials
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ADD/REMOVE ABOUT POINTS (ADMIN) ====================

// @desc    Add point to about section
// @route   POST /api/homepage/about/points
export const addAboutPoint = async (req, res) => {
  try {
    const { point } = req.body;

    const homePage = await HomePage.findOne();
    
    if (!homePage) {
      return res.status(404).json({
        success: false,
        message: 'Home page not found'
      });
    }

    homePage.about.points.push({ point });
    await homePage.save();

    res.status(201).json({
      success: true,
      message: 'About point added successfully',
      data: homePage.about.points
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove point from about section
// @route   DELETE /api/homepage/about/points/:index
export const removeAboutPoint = async (req, res) => {
  try {
    const { index } = req.params;

    const homePage = await HomePage.findOne();
    
    if (!homePage) {
      return res.status(404).json({
        success: false,
        message: 'Home page not found'
      });
    }

    if (index < 0 || index >= homePage.about.points.length) {
      return res.status(404).json({
        success: false,
        message: 'About point not found at this index'
      });
    }

    homePage.about.points.splice(index, 1);
    await homePage.save();

    res.json({
      success: true,
      message: 'About point removed successfully',
      data: homePage.about.points
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ADD/REMOVE ACHIEVEMENTS IMAGES (ADMIN) ====================

// @desc    Add image to achievements section
// @route   POST /api/homepage/achievements/images
export const addAchievementImage = async (req, res) => {
  try {
    const { image } = req.body;

    const homePage = await HomePage.findOne();
    
    if (!homePage) {
      return res.status(404).json({
        success: false,
        message: 'Home page not found'
      });
    }

    homePage.achievements.images.push(image);
    await homePage.save();

    res.status(201).json({
      success: true,
      message: 'Achievement image added successfully',
      data: homePage.achievements.images
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove image from achievements section
// @route   DELETE /api/homepage/achievements/images/:index
export const removeAchievementImage = async (req, res) => {
  try {
    const { index } = req.params;

    const homePage = await HomePage.findOne();
    
    if (!homePage) {
      return res.status(404).json({
        success: false,
        message: 'Home page not found'
      });
    }

    if (index < 0 || index >= homePage.achievements.images.length) {
      return res.status(404).json({
        success: false,
        message: 'Image not found at this index'
      });
    }

    homePage.achievements.images.splice(index, 1);
    await homePage.save();

    res.json({
      success: true,
      message: 'Achievement image removed successfully',
      data: homePage.achievements.images
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};