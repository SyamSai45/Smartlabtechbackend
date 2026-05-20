import { Blog, BlogsPage } from '../models/BlogsPage.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Save uploaded file
const saveFile = async (file, folder) => {
  if (!file) return null;
  if (typeof file === 'string' && (file.startsWith('http://') || file.startsWith('https://'))) return file;
  
  const uploadDir = path.join(__dirname, '../uploads/blogs', folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  
  const filename = `${folder}-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
  fs.copyFileSync(file.path, path.join(uploadDir, filename));
  try { fs.unlinkSync(file.path); } catch(e) {}
  
  return `/uploads/blogs/${folder}/${filename}`;
};

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true' || value === '1' || value === 'yes';
  return Boolean(value);
};

const addFullUrls = (data, baseUrl) => {
  const result = { ...data };
  const urlFields = ['blogHero.image', 'bgImage', 'mainImage', 'author.image'];
  urlFields.forEach(field => {
    const parts = field.split('.');
    let obj = result;
    for (let i = 0; i < parts.length - 1; i++) obj = obj?.[parts[i]];
    if (obj?.[parts[parts.length - 1]] && !obj[parts[parts.length - 1]].startsWith('http')) {
      obj[parts[parts.length - 1]] = `${baseUrl}${obj[parts[parts.length - 1]]}`;
    }
  });
  return result;
};

// ==================== BLOGS PAGE ====================
export const getBlogsPage = async (req, res) => {
  try {
    const blogsPage = await BlogsPage.findOne({ isActive: true });
    if (!blogsPage) return res.status(404).json({ success: false, message: 'Blogs page not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls(blogsPage.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== BLOG HERO CRUD ====================
const handleBlogHero = async (req, res, isUpdate = false) => {
  try {
    let blogsPage = await BlogsPage.findOne();
    if (!blogsPage) blogsPage = new BlogsPage();
    
    if (!isUpdate && blogsPage.blogHero) {
      return res.status(400).json({ success: false, message: 'Blog hero already exists. Use update.' });
    }
    if (isUpdate && (!blogsPage || !blogsPage.blogHero)) {
      return res.status(404).json({ success: false, message: 'Blog hero not found' });
    }
    
    const image = req.file ? await saveFile(req.file, 'hero') : req.body.image;
    if (!isUpdate) {
      blogsPage.blogHero = { title: req.body.title, tag: req.body.tag, description: req.body.description, image: image || '', isActive: toBoolean(req.body.isActive) };
    } else {
      if (req.body.title !== undefined) blogsPage.blogHero.title = req.body.title;
      if (req.body.tag !== undefined) blogsPage.blogHero.tag = req.body.tag;
      if (req.body.description !== undefined) blogsPage.blogHero.description = req.body.description;
      if (image) blogsPage.blogHero.image = image;
      if (req.body.isActive !== undefined) blogsPage.blogHero.isActive = toBoolean(req.body.isActive);
    }
    
    await blogsPage.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(isUpdate ? 200 : 201).json({ success: true, message: `Blog hero ${isUpdate ? 'updated' : 'created'}`, data: addFullUrls(blogsPage.toObject(), baseUrl).blogHero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBlogHero = (req, res) => handleBlogHero(req, res, false);
export const updateBlogHero = (req, res) => handleBlogHero(req, res, true);

export const getBlogHero = async (req, res) => {
  try {
    const blogsPage = await BlogsPage.findOne();
    if (!blogsPage?.blogHero) return res.status(404).json({ success: false, message: 'Blog hero not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls({ blogHero: blogsPage.blogHero }, baseUrl).blogHero });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBlogHero = async (req, res) => {
  try {
    const blogsPage = await BlogsPage.findOne();
    if (!blogsPage) return res.status(404).json({ success: false, message: 'Blogs page not found' });
    blogsPage.blogHero = undefined;
    await blogsPage.save();
    res.json({ success: true, message: 'Blog hero deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== BLOG CRUD ====================
export const createBlog = async (req, res) => {
  try {
    const { title, duration, date, category, author, shortDescription, longDescription, quote, tags, isFeatured } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
    
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (await Blog.findOne({ slug })) return res.status(400).json({ success: false, message: 'Blog with this title already exists' });
    
    const bgImage = req.files?.bgImage ? await saveFile(req.files.bgImage[0], 'bg') : req.body.bgImage;
    const mainImage = req.files?.mainImage ? await saveFile(req.files.mainImage[0], 'main') : req.body.mainImage;
    const authorImage = req.files?.authorImage ? await saveFile(req.files.authorImage[0], 'author') : req.body.authorImage;
    const authorData = typeof author === 'string' ? JSON.parse(author) : author;
    const tagsArray = typeof tags === 'string' ? JSON.parse(tags) : (tags || []);
    
    const blog = await Blog.create({
      title, slug, bgImage: bgImage || '', mainImage: mainImage || '', duration: duration || '',
      date: date || Date.now(), category: category || '', shortDescription: shortDescription || '',
      longDescription: longDescription || '', quote: quote || '', tags: tagsArray,
      author: { name: authorData?.name || '', image: authorImage || '', role: authorData?.role || '' },
      isFeatured: toBoolean(isFeatured), isActive: true
    });
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ success: true, message: 'Blog created', data: addFullUrls(blog.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag, search, isFeatured, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = { isActive: true };
    
    if (category && category.trim()) query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    if (isFeatured === 'true') query.isFeatured = true;
    if (tag && tag.trim()) query.tags = { $in: [tag] };
    if (search && search.trim()) query.$or = [
      { title: { $regex: search, $options: 'i' } }, { shortDescription: { $regex: search, $options: 'i' } },
      { longDescription: { $regex: search, $options: 'i' } }, { category: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
    
    const blogs = await Blog.find(query).sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit));
    const total = await Blog.countDocuments(query);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    let allCategories = [], allTags = [];
    if (!search && !category && !tag && !isFeatured) {
      allCategories = await Blog.distinct('category', { isActive: true });
      allTags = [...new Set((await Blog.distinct('tags', { isActive: true })).flat())];
    }
    
    res.json({ success: true, data: blogs.map(blog => addFullUrls(blog.toObject(), baseUrl)),
      filters: { categories: allCategories, tags: allTags },
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isActive: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls(blog.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls(blog.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    
    if (req.body.title && req.body.title !== blog.title) {
      req.body.slug = req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (await Blog.findOne({ slug: req.body.slug, _id: { $ne: req.params.id } })) {
        return res.status(400).json({ success: false, message: 'Blog with this title already exists' });
      }
    }
    
    if (req.files?.bgImage) req.body.bgImage = await saveFile(req.files.bgImage[0], 'bg');
    if (req.files?.mainImage) req.body.mainImage = await saveFile(req.files.mainImage[0], 'main');
    if (req.files?.authorImage && blog.author) {
      req.body.author = { ...blog.author.toObject(), image: await saveFile(req.files.authorImage[0], 'author') };
    }
    if (req.body.author && typeof req.body.author === 'string') req.body.author = JSON.parse(req.body.author);
    if (req.body.tags && typeof req.body.tags === 'string') req.body.tags = JSON.parse(req.body.tags);
    if (req.body.isFeatured !== undefined) req.body.isFeatured = toBoolean(req.body.isFeatured);
    if (req.body.isActive !== undefined) req.body.isActive = toBoolean(req.body.isActive);
    
    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: 'Blog updated', data: addFullUrls(updatedBlog.toObject(), baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeaturedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isFeatured: true, isActive: true }).sort({ createdAt: -1 }).limit(parseInt(req.query.limit || 6));
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: blogs.map(blog => addFullUrls(blog.toObject(), baseUrl)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Blog.distinct('category', { isActive: true });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTags = async (req, res) => {
  try {
    const tags = await Blog.distinct('tags', { isActive: true });
    res.json({ success: true, data: [...new Set(tags.flat())] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};