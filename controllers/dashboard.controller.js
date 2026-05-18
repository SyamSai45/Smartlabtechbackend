import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import {Contact} from '../models/Contact.js';
import Quote from '../models/Quote.js';
import Notification from '../models/Notification.js';
import {Blog} from '../models/BlogsPage.js';

// Helper function for safe aggregation
const safeAggregate = async (model, pipeline, defaultValue = 0) => {
  try {
    const result = await model.aggregate(pipeline);
    return result[0] || defaultValue;
  } catch (error) {
    console.error('Aggregate error:', error.message);
    return defaultValue;
  }
};

// @desc    Get dashboard statistics (Admin)
// @route   GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Execute all queries in parallel
    const [
      // Product stats
      totalProducts,
      activeProducts,
      featuredProducts,
      // REMOVED: lowStockProducts and outOfStockProducts (no quantity field)
      
      // Category & Brand stats
      totalCategories,
      totalBrands,
      
      // Contact stats
      totalContacts,
      pendingContacts,
      readContacts,
      repliedContacts,
      todayContacts,
      weekContacts,
      monthContacts,
      
      // Quote stats
      totalQuotes,
      pendingQuotes,
      processingQuotes,
      quotedQuotes,
      approvedQuotes,
      rejectedQuotes,
      completedQuotes,
      todayQuotes,
      weekQuotes,
      monthQuotes,
      
      // Notification stats
      unreadNotifications,
      totalNotifications,
      
      // Blog stats (with error handling)
      totalBlogs,
      featuredBlogs,
      
      // Recent data
      recentContacts,
      recentQuotes,
      recentProducts
      
    ] = await Promise.all([
      // Product stats
      Product.countDocuments({ isActive: true }).catch(() => 0),
      Product.countDocuments({ isActive: true }).catch(() => 0),
      Product.countDocuments({ isFeatured: true, isActive: true }).catch(() => 0),
      
      // Category stats
      Category.countDocuments({ isActive: true }).catch(() => 0),
      
      // Brand stats
      Brand.countDocuments({ isActive: true }).catch(() => 0),
      
      // Contact stats
      Contact.countDocuments({ isActive: true }).catch(() => 0),
      Contact.countDocuments({ status: 'pending', isActive: true }).catch(() => 0),
      Contact.countDocuments({ status: 'read', isActive: true }).catch(() => 0),
      Contact.countDocuments({ status: 'replied', isActive: true }).catch(() => 0),
      Contact.countDocuments({ createdAt: { $gte: today }, isActive: true }).catch(() => 0),
      Contact.countDocuments({ createdAt: { $gte: startOfWeek }, isActive: true }).catch(() => 0),
      Contact.countDocuments({ createdAt: { $gte: startOfMonth }, isActive: true }).catch(() => 0),
      
      // Quote stats
      Quote.countDocuments({ isActive: true }).catch(() => 0),
      Quote.countDocuments({ status: 'pending', isActive: true }).catch(() => 0),
      Quote.countDocuments({ status: 'processing', isActive: true }).catch(() => 0),
      Quote.countDocuments({ status: 'quoted', isActive: true }).catch(() => 0),
      Quote.countDocuments({ status: 'approved', isActive: true }).catch(() => 0),
      Quote.countDocuments({ status: 'rejected', isActive: true }).catch(() => 0),
      Quote.countDocuments({ status: 'completed', isActive: true }).catch(() => 0),
      Quote.countDocuments({ createdAt: { $gte: today }, isActive: true }).catch(() => 0),
      Quote.countDocuments({ createdAt: { $gte: startOfWeek }, isActive: true }).catch(() => 0),
      Quote.countDocuments({ createdAt: { $gte: startOfMonth }, isActive: true }).catch(() => 0),
      
      // Notification stats
      Notification.countDocuments({ isRead: false, isActive: true }).catch(() => 0),
      Notification.countDocuments({ isActive: true }).catch(() => 0),
      
      // Blog stats - handle possible missing model
      (async () => {
        try {
          if (Blog && Blog.countDocuments) {
            const [total, featured] = await Promise.all([
              Blog.countDocuments({ isActive: true }).catch(() => 0),
              Blog.countDocuments({ isFeatured: true, isActive: true }).catch(() => 0)
            ]);
            return [total, featured];
          }
          return [0, 0];
        } catch (err) {
          console.log('Blog stats not available:', err.message);
          return [0, 0];
        }
      })(),
      
      // Recent data
      Contact.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).catch(() => []),
      Quote.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).catch(() => []),
      Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).catch(() => [])
    ]);
    
    // Extract blog stats from array
    const [totalBlogsValue, featuredBlogsValue] = Array.isArray(totalBlogs) ? totalBlogs : [0, 0];
    const actualTotalBlogs = Array.isArray(totalBlogs) ? totalBlogs[0] : totalBlogs;
    const actualFeaturedBlogs = Array.isArray(featuredBlogs) ? featuredBlogs[0] : featuredBlogs;
    
    // Get total product value and average price (with error handling)
    let totalProductValue = 0;
    let avgProductPrice = 0;
    
    try {
      const productValue = await Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$price' }, avg: { $avg: '$price' } } }
      ]);
      if (productValue[0]) {
        totalProductValue = productValue[0].total || 0;
        avgProductPrice = Math.round(productValue[0].avg || 0);
      }
    } catch (err) {
      console.log('Product value stats error:', err.message);
    }
    
    // Get total quote value (with error handling)
    let totalQuoteValue = 0;
    try {
      const quoteValue = await Quote.aggregate([
        { $match: { status: 'approved', isActive: true } },
        { $group: { _id: null, total: { $sum: '$quotedPrice' } } }
      ]);
      if (quoteValue[0]) {
        totalQuoteValue = quoteValue[0].total || 0;
      }
    } catch (err) {
      console.log('Quote value stats error:', err.message);
    }
    
    res.json({
      success: true,
      data: {
        products: {
          total: totalProducts || 0,
          active: activeProducts || 0,
          featured: featuredProducts || 0
        },
        
        categories: {
          total: totalCategories || 0
        },
        
        brands: {
          total: totalBrands || 0
        },
        
        contacts: {
          total: totalContacts || 0,
          pending: pendingContacts || 0,
          read: readContacts || 0,
          replied: repliedContacts || 0,
          today: todayContacts || 0,
          thisWeek: weekContacts || 0,
          thisMonth: monthContacts || 0,
          recent: recentContacts || []
        },
        
        quotes: {
          total: totalQuotes || 0,
          pending: pendingQuotes || 0,
          processing: processingQuotes || 0,
          quoted: quotedQuotes || 0,
          approved: approvedQuotes || 0,
          rejected: rejectedQuotes || 0,
          completed: completedQuotes || 0,
          today: todayQuotes || 0,
          thisWeek: weekQuotes || 0,
          thisMonth: monthQuotes || 0,
          totalValue: totalQuoteValue,
          recent: recentQuotes || []
        },
        
        notifications: {
          unread: unreadNotifications || 0,
          total: totalNotifications || 0
        },
        
        blogs: {
          total: actualTotalBlogs || 0,
          featured: actualFeaturedBlogs || 0
        },
        
        recentActivity: {
          contacts: recentContacts || [],
          quotes: recentQuotes || [],
          products: recentProducts || []
        },
        
        summary: {
          totalLeads: (totalContacts || 0) + (totalQuotes || 0),
          pendingActions: (pendingContacts || 0) + (pendingQuotes || 0) + (processingQuotes || 0),
          conversionRate: (totalQuotes || 0) > 0 ? Math.round(((approvedQuotes || 0) / (totalQuotes || 0)) * 100) : 0,
          activeProducts: activeProducts || 0
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      // Return empty data structure to prevent frontend errors
      data: {
        products: { total: 0, active: 0, featured: 0 },
        categories: { total: 0 },
        brands: { total: 0 },
        contacts: { total: 0, pending: 0, read: 0, replied: 0, today: 0, thisWeek: 0, thisMonth: 0, recent: [] },
        quotes: { total: 0, pending: 0, processing: 0, quoted: 0, approved: 0, rejected: 0, completed: 0, today: 0, thisWeek: 0, thisMonth: 0, totalValue: 0, recent: [] },
        notifications: { unread: 0, total: 0 },
        blogs: { total: 0, featured: 0 },
        recentActivity: { contacts: [], quotes: [], products: [] },
        summary: { totalLeads: 0, pendingActions: 0, conversionRate: 0, activeProducts: 0 }
      }
    });
  }
};

// @desc    Get chart data for dashboard (Admin)
// @route   GET /api/dashboard/charts
export const getChartData = async (req, res) => {
  try {
    const { days = 30, type = 'contacts' } = req.query;
    const daysInt = parseInt(days);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysInt);
    startDate.setHours(0, 0, 0, 0);
    
    let data = [];
    
    if (type === 'contacts') {
      // Contact trend data
      data = await Contact.aggregate([
        { $match: { createdAt: { $gte: startDate }, isActive: true } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
            replied: { $sum: { $cond: [{ $eq: ['$status', 'replied'] }, 1, 0] } }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);
    } else if (type === 'quotes') {
      // Quote trend data
      data = await Quote.aggregate([
        { $match: { createdAt: { $gte: startDate }, isActive: true } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            totalValue: { $sum: '$quotedPrice' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);
    } else if (type === 'products') {
      // Product creation trend
      data = await Product.aggregate([
        { $match: { createdAt: { $gte: startDate }, isActive: true } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);
    }
    
    // Format dates for frontend
    const formattedData = data.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      count: item.count,
      ...(item.pending !== undefined && { pending: item.pending }),
      ...(item.read !== undefined && { read: item.read }),
      ...(item.replied !== undefined && { replied: item.replied }),
      ...(item.approved !== undefined && { approved: item.approved }),
      ...(item.totalValue !== undefined && { totalValue: item.totalValue })
    }));
    
    res.json({
      success: true,
      data: formattedData,
      meta: {
        days: daysInt,
        type,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Chart data error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get top performing data (Admin)
// @route   GET /api/dashboard/top
export const getTopPerforming = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const limitInt = parseInt(limit);
    
    // Top products by quote requests
    const topProducts = await Quote.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$productName', count: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } },
      { $sort: { count: -1 } },
      { $limit: limitInt }
    ]);
    
    // Top categories by products
    const topCategories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$categoryName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limitInt }
    ]);
    
    // Top brands by products
    const topBrands = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$brandName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limitInt }
    ]);
    
    // Most contacted subjects
    const topSubjects = await Contact.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$subjectName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limitInt }
    ]);
    
    res.json({
      success: true,
      data: {
        topProducts,
        topCategories,
        topBrands,
        topSubjects
      }
    });
  } catch (error) {
    console.error('Top performing error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get recent activity feed (Admin)
// @route   GET /api/dashboard/activity
export const getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const limitInt = parseInt(limit);
    
    // Get recent contacts
    const recentContacts = await Contact.find({ isActive: true })
      .select('name email createdAt status')
      .sort({ createdAt: -1 })
      .limit(limitInt);
    
    // Get recent quotes
    const recentQuotes = await Quote.find({ isActive: true })
      .select('name company productName quantity createdAt status')
      .sort({ createdAt: -1 })
      .limit(limitInt);
    
    // Get recent products
    const recentProducts = await Product.find({ isActive: true })
      .select('name price createdAt isFeatured')
      .sort({ createdAt: -1 })
      .limit(limitInt);
    
    // Get recent notifications
    const recentNotifications = await Notification.find({ isActive: true })
      .select('title message type priority createdAt isRead')
      .sort({ createdAt: -1 })
      .limit(limitInt);
    
    // Combine and sort all activities
    const activities = [
      ...recentContacts.map(c => ({
        type: 'contact',
        id: c._id,
        title: `New contact from ${c.name}`,
        description: `${c.email}`,
        status: c.status,
        createdAt: c.createdAt,
        icon: 'message'
      })),
      ...recentQuotes.map(q => ({
        type: 'quote',
        id: q._id,
        title: `Quote request from ${q.name}`,
        description: `${q.quantity} x ${q.productName}`,
        status: q.status,
        createdAt: q.createdAt,
        icon: 'shopping-cart'
      })),
      ...recentProducts.map(p => ({
        type: 'product',
        id: p._id,
        title: `New product added`,
        description: p.name,
        status: p.isFeatured ? 'featured' : 'active',
        createdAt: p.createdAt,
        icon: 'package'
      })),
      ...recentNotifications.map(n => ({
        type: 'notification',
        id: n._id,
        title: n.title,
        description: n.message,
        status: n.isRead ? 'read' : 'unread',
        createdAt: n.createdAt,
        icon: 'bell'
      }))
    ];
    
    // Sort by date (newest first)
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      data: activities.slice(0, limitInt),
      total: activities.length
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get quick stats for dashboard cards (Admin)
// @route   GET /api/dashboard/quick-stats
export const getQuickStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const [
      todayContacts,
      yesterdayContacts,
      weekContacts,
      todayQuotes,
      yesterdayQuotes,
      weekQuotes,
      totalProducts,
      lowStockProducts,
      pendingNotifications
    ] = await Promise.all([
      Contact.countDocuments({ createdAt: { $gte: today }, isActive: true }),
      Contact.countDocuments({ createdAt: { $gte: yesterday, $lt: today }, isActive: true }),
      Contact.countDocuments({ createdAt: { $gte: startOfWeek }, isActive: true }),
      Quote.countDocuments({ createdAt: { $gte: today }, isActive: true }),
      Quote.countDocuments({ createdAt: { $gte: yesterday, $lt: today }, isActive: true }),
      Quote.countDocuments({ createdAt: { $gte: startOfWeek }, isActive: true }),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ inStock: true, quantity: { $lt: 10 } }),
      Notification.countDocuments({ isRead: false, isActive: true })
    ]);
    
    // Calculate percentage changes
    const contactsChange = yesterdayContacts === 0 
      ? todayContacts > 0 ? 100 : 0
      : Math.round(((todayContacts - yesterdayContacts) / yesterdayContacts) * 100);
    
    const quotesChange = yesterdayQuotes === 0
      ? todayQuotes > 0 ? 100 : 0
      : Math.round(((todayQuotes - yesterdayQuotes) / yesterdayQuotes) * 100);
    
    res.json({
      success: true,
      data: {
        contacts: {
          today: todayContacts,
          thisWeek: weekContacts,
          change: contactsChange,
          trend: contactsChange >= 0 ? 'up' : 'down'
        },
        quotes: {
          today: todayQuotes,
          thisWeek: weekQuotes,
          change: quotesChange,
          trend: quotesChange >= 0 ? 'up' : 'down'
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts
        },
        notifications: {
          unread: pendingNotifications
        }
      }
    });
  } catch (error) {
    console.error('Quick stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};