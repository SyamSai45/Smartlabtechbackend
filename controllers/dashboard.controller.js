import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import { Contact } from '../models/Contact.js';
import Quote from '../models/Quote.js';
import Notification from '../models/Notification.js';
import { Blog } from '../models/BlogsPage.js';

// Helper: Safe count with error handling
const safeCount = async (model, query = {}, errorValue = 0) => {
  try {
    return await model.countDocuments(query);
  } catch (error) {
    console.error('Count error:', error.message);
    return errorValue;
  }
};

// Helper: Safe aggregate
const safeAggregate = async (model, pipeline, defaultValue = 0) => {
  try {
    const result = await model.aggregate(pipeline);
    return result[0] || defaultValue;
  } catch (error) {
    console.error('Aggregate error:', error.message);
    return defaultValue;
  }
};

// Helper: Get date ranges
const getDateRanges = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return { today, startOfWeek, startOfMonth };
};

// Helper: Get contact stats
const getContactStats = async (today, startOfWeek, startOfMonth) => {
  const statuses = ['pending', 'read', 'replied'];
  const [total, ...statusCounts] = await Promise.all([
    safeCount(Contact, { isActive: true }),
    ...statuses.map(s => safeCount(Contact, { status: s, isActive: true })),
    safeCount(Contact, { createdAt: { $gte: today }, isActive: true }),
    safeCount(Contact, { createdAt: { $gte: startOfWeek }, isActive: true }),
    safeCount(Contact, { createdAt: { $gte: startOfMonth }, isActive: true })
  ]);
  
  const stats = { total };
  statuses.forEach((s, i) => stats[s] = statusCounts[i]);
  stats.today = statusCounts[3];
  stats.thisWeek = statusCounts[4];
  stats.thisMonth = statusCounts[5];
  
  return stats;
};

// Helper: Get quote stats
const getQuoteStats = async (today, startOfWeek, startOfMonth) => {
  const statuses = ['pending', 'processing', 'quoted', 'approved', 'rejected', 'completed'];
  const [total, ...statusCounts] = await Promise.all([
    safeCount(Quote, { isActive: true }),
    ...statuses.map(s => safeCount(Quote, { status: s, isActive: true })),
    safeCount(Quote, { createdAt: { $gte: today }, isActive: true }),
    safeCount(Quote, { createdAt: { $gte: startOfWeek }, isActive: true }),
    safeCount(Quote, { createdAt: { $gte: startOfMonth }, isActive: true })
  ]);
  
  const stats = { total };
  statuses.forEach((s, i) => stats[s] = statusCounts[i]);
  stats.today = statusCounts[6];
  stats.thisWeek = statusCounts[7];
  stats.thisMonth = statusCounts[8];
  
  const totalValue = await safeAggregate(Quote, [
    { $match: { status: 'approved', isActive: true } },
    { $group: { _id: null, total: { $sum: '$quotedPrice' } } }
  ], { total: 0 });
  
  stats.totalValue = totalValue.total || 0;
  return stats;
};

// Helper: Get recent items
const getRecentItems = async (model, select, limit = 5) => {
  try {
    return await model.find({ isActive: true }).select(select).sort({ createdAt: -1 }).limit(limit);
  } catch (error) {
    return [];
  }
};

// ==================== MAIN DASHBOARD STATS ====================

export const getDashboardStats = async (req, res) => {
  try {
    const { today, startOfWeek, startOfMonth } = getDateRanges();
    
    // Run all queries in parallel
    const [
      productStats,
      totalCategories, totalBrands,
      contactStats,
      quoteStats,
      notificationStats,
      blogStats,
      recentContacts, recentQuotes, recentProducts,
      productValueStats
    ] = await Promise.all([
      // Product stats
      Promise.all([
        safeCount(Product, { isActive: true }),
        safeCount(Product, { isFeatured: true, isActive: true })
      ]),
      safeCount(Category, { isActive: true }),
      safeCount(Brand, { isActive: true }),
      getContactStats(today, startOfWeek, startOfMonth),
      getQuoteStats(today, startOfWeek, startOfMonth),
      Promise.all([
        safeCount(Notification, { isActive: true }),
        safeCount(Notification, { isRead: false, isActive: true })
      ]),
      (async () => {
        try {
          const [total, featured] = await Promise.all([
            safeCount(Blog, { isActive: true }),
            safeCount(Blog, { isFeatured: true, isActive: true })
          ]);
          return { total, featured };
        } catch { return { total: 0, featured: 0 }; }
      })(),
      getRecentItems(Contact, 'name email createdAt status', 5),
      getRecentItems(Quote, 'name company productName quantity createdAt status', 5),
      getRecentItems(Product, 'name price createdAt isFeatured', 5),
      safeAggregate(Product, [
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$price' }, avg: { $avg: '$price' } } }
      ], { total: 0, avg: 0 })
    ]);
    
    const [totalProducts, featuredProducts] = productStats;
    const [totalNotifications, unreadNotifications] = notificationStats;
    const totalProductValue = productValueStats.total || 0;
    const avgProductPrice = Math.round(productValueStats.avg || 0);
    
    const totalLeads = (contactStats.total || 0) + (quoteStats.total || 0);
    const pendingActions = (contactStats.pending || 0) + (quoteStats.pending || 0) + (quoteStats.processing || 0);
    const conversionRate = quoteStats.total > 0 ? Math.round((quoteStats.approved / quoteStats.total) * 100) : 0;
    
    res.json({
      success: true,
      data: {
        products: { total: totalProducts, active: totalProducts, featured: featuredProducts },
        categories: { total: totalCategories },
        brands: { total: totalBrands },
        contacts: { ...contactStats, recent: recentContacts },
        quotes: { ...quoteStats, recent: recentQuotes },
        notifications: { unread: unreadNotifications, total: totalNotifications },
        blogs: blogStats,
        recentActivity: { contacts: recentContacts, quotes: recentQuotes, products: recentProducts },
        summary: { totalLeads, pendingActions, conversionRate, activeProducts: totalProducts }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      data: getEmptyDashboardData()
    });
  }
};

// ==================== CHART DATA ====================

export const getChartData = async (req, res) => {
  try {
    const { days = 30, type = 'contacts' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);
    
    const models = { contacts: Contact, quotes: Quote, products: Product };
    const model = models[type];
    if (!model) return res.status(400).json({ success: false, message: 'Invalid type' });
    
    const pipeline = [
      { $match: { createdAt: { $gte: startDate }, isActive: true } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          ...(type === 'contacts' && {
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
            replied: { $sum: { $cond: [{ $eq: ['$status', 'replied'] }, 1, 0] } }
          }),
          ...(type === 'quotes' && {
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            totalValue: { $sum: '$quotedPrice' }
          })
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ];
    
    const data = await model.aggregate(pipeline);
    const formattedData = data.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      count: item.count,
      ...(item.pending !== undefined && { pending: item.pending }),
      ...(item.read !== undefined && { read: item.read }),
      ...(item.replied !== undefined && { replied: item.replied }),
      ...(item.approved !== undefined && { approved: item.approved }),
      ...(item.totalValue !== undefined && { totalValue: item.totalValue })
    }));
    
    res.json({ success: true, data: formattedData, meta: { days: parseInt(days), type, startDate, endDate: new Date() } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== TOP PERFORMING ====================

export const getTopPerforming = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || 5);
    const aggregates = await Promise.all([
      Quote.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$productName', count: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } }, { $sort: { count: -1 } }, { $limit: limit }]),
      Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$categoryName', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: limit }]),
      Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$brandName', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: limit }]),
      Contact.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$subjectName', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: limit }])
    ]);
    
    res.json({ success: true, data: { topProducts: aggregates[0], topCategories: aggregates[1], topBrands: aggregates[2], topSubjects: aggregates[3] } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== RECENT ACTIVITY ====================

export const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || 20);
    const [recentContacts, recentQuotes, recentProducts, recentNotifications] = await Promise.all([
      getRecentItems(Contact, 'name email createdAt status', limit),
      getRecentItems(Quote, 'name company productName quantity createdAt status', limit),
      getRecentItems(Product, 'name price createdAt isFeatured', limit),
      getRecentItems(Notification, 'title message type priority createdAt isRead', limit)
    ]);
    
    const activityMap = {
      contact: { items: recentContacts, title: (c) => `New contact from ${c.name}`, desc: (c) => c.email, icon: 'message', status: (c) => c.status },
      quote: { items: recentQuotes, title: (q) => `Quote request from ${q.name}`, desc: (q) => `${q.quantity} x ${q.productName}`, icon: 'shopping-cart', status: (q) => q.status },
      product: { items: recentProducts, title: () => 'New product added', desc: (p) => p.name, icon: 'package', status: (p) => p.isFeatured ? 'featured' : 'active' },
      notification: { items: recentNotifications, title: (n) => n.title, desc: (n) => n.message, icon: 'bell', status: (n) => n.isRead ? 'read' : 'unread' }
    };
    
    const activities = Object.entries(activityMap).flatMap(([type, { items, title, desc, icon, status }]) =>
      items.map(item => ({ type, id: item._id, title: title(item), description: desc(item), status: status(item), createdAt: item.createdAt, icon }))
    );
    
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: activities.slice(0, limit), total: activities.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== QUICK STATS ====================

export const getQuickStats = async (req, res) => {
  try {
    const { today } = getDateRanges();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const [todayContacts, yesterdayContacts, weekContacts, todayQuotes, yesterdayQuotes, weekQuotes, totalProducts, pendingNotifications] = await Promise.all([
      safeCount(Contact, { createdAt: { $gte: today }, isActive: true }),
      safeCount(Contact, { createdAt: { $gte: yesterday, $lt: today }, isActive: true }),
      safeCount(Contact, { createdAt: { $gte: startOfWeek }, isActive: true }),
      safeCount(Quote, { createdAt: { $gte: today }, isActive: true }),
      safeCount(Quote, { createdAt: { $gte: yesterday, $lt: today }, isActive: true }),
      safeCount(Quote, { createdAt: { $gte: startOfWeek }, isActive: true }),
      safeCount(Product, { isActive: true }),
      safeCount(Notification, { isRead: false, isActive: true })
    ]);
    
    const calcChange = (todayVal, yesterdayVal) => yesterdayVal === 0 ? (todayVal > 0 ? 100 : 0) : Math.round(((todayVal - yesterdayVal) / yesterdayVal) * 100);
    const contactsChange = calcChange(todayContacts, yesterdayContacts);
    const quotesChange = calcChange(todayQuotes, yesterdayQuotes);
    
    res.json({
      success: true,
      data: {
        contacts: { today: todayContacts, thisWeek: weekContacts, change: contactsChange, trend: contactsChange >= 0 ? 'up' : 'down' },
        quotes: { today: todayQuotes, thisWeek: weekQuotes, change: quotesChange, trend: quotesChange >= 0 ? 'up' : 'down' },
        products: { total: totalProducts, lowStock: 0 },
        notifications: { unread: pendingNotifications }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Empty data structure for error responses
const getEmptyDashboardData = () => ({
  products: { total: 0, active: 0, featured: 0 },
  categories: { total: 0 },
  brands: { total: 0 },
  contacts: { total: 0, pending: 0, read: 0, replied: 0, today: 0, thisWeek: 0, thisMonth: 0, recent: [] },
  quotes: { total: 0, pending: 0, processing: 0, quoted: 0, approved: 0, rejected: 0, completed: 0, today: 0, thisWeek: 0, thisMonth: 0, totalValue: 0, recent: [] },
  notifications: { unread: 0, total: 0 },
  blogs: { total: 0, featured: 0 },
  recentActivity: { contacts: [], quotes: [], products: [] },
  summary: { totalLeads: 0, pendingActions: 0, conversionRate: 0, activeProducts: 0 }
});