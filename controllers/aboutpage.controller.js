import AboutPage from '../models/AboutPage.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Save uploaded file
const saveFile = async (file, folder) => {
if (!file) return null;

if (typeof file === 'string' && (file.startsWith('http://') || file.startsWith('https://'))) {
return file;
}

const uploadDir = path.join(__dirname, '../uploads/aboutpage', folder);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const timestamp = Date.now();
const random = Math.round(Math.random() * 1E9);
const ext = path.extname(file.originalname);
const filename = `${folder}-${timestamp}-${random}${ext}`;
const destPath = path.join(uploadDir, filename);

fs.copyFileSync(file.path, destPath);
try { fs.unlinkSync(file.path); } catch(e) {}

return `/uploads/aboutpage/${folder}/${filename}`;
};

// Helper: Add full URLs to response
const addFullUrls = (data, baseUrl) => {
const result = { ...data };

if (result.hero?.image && !result.hero.image.startsWith('http')) {
result.hero.image = `${baseUrl}${result.hero.image}`;
}
if (result.about?.bgImage && !result.about.bgImage.startsWith('http')) {
result.about.bgImage = `${baseUrl}${result.about.bgImage}`;
}
if (result.whyChooseUs?.image && !result.whyChooseUs.image.startsWith('http')) {
result.whyChooseUs.image = `${baseUrl}${result.whyChooseUs.image}`;
}
if (result.cards && Array.isArray(result.cards)) {
result.cards = result.cards.map(card => ({
...card,
image: card.image && !card.image.startsWith('http') ? `${baseUrl}${card.image}` : card.image
}));
}
if (result.coreValues?.values) {
result.coreValues.values = result.coreValues.values.map(val => ({
...val,
icon: val.icon && !val.icon.startsWith('http') ? `${baseUrl}${val.icon}` : val.icon
}));
}

return result;
};

// ==================== FULL PAGE CRUD ====================

// Get About Page (Public)
export const getAboutPage = async (req, res) => {
try {
let aboutPage = await AboutPage.findOne({ isActive: true });
if (!aboutPage) {
return res.status(404).json({ success: false, message: 'About page not found' });
}
const baseUrl = `${req.protocol}://${req.get('host')}`;
res.json({ success: true, data: addFullUrls(aboutPage.toObject(), baseUrl) });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Create About Page (Admin)
export const createAboutPage = async (req, res) => {
try {
const existingPage = await AboutPage.findOne();
if (existingPage) {
return res.status(400).json({ success: false, message: 'About page already exists. Use PUT to update.' });
}

const aboutPage = await AboutPage.create(req.body);
const baseUrl = `${req.protocol}://${req.get('host')}`;
res.status(201).json({ success: true, message: 'About page created', data: addFullUrls(aboutPage.toObject(), baseUrl) });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Update About Page (Admin)
export const updateAboutPage = async (req, res) => {
try {
let aboutPage = await AboutPage.findOne();
if (!aboutPage) {
return res.status(404).json({ success: false, message: 'About page not found' });
}

const { hero, about, cards, coreValues, whyChooseUs, cta, isActive } = req.body;
if (hero) aboutPage.hero = hero;
if (about) aboutPage.about = about;
if (cards) aboutPage.cards = cards;
if (coreValues) aboutPage.coreValues = coreValues;
if (whyChooseUs) aboutPage.whyChooseUs = whyChooseUs;
if (cta) aboutPage.cta = cta;
if (isActive !== undefined) aboutPage.isActive = isActive;

await aboutPage.save();
const baseUrl = `${req.protocol}://${req.get('host')}`;
res.json({ success: true, message: 'About page updated', data: addFullUrls(aboutPage.toObject(), baseUrl) });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Delete About Page (Admin)
export const deleteAboutPage = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage) {
return res.status(404).json({ success: false, message: 'About page not found' });
}
await AboutPage.deleteMany({});
res.json({ success: true, message: 'About page deleted' });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// ==================== HERO SECTION CRUD ====================

// Create Hero
export const createHero = async (req, res) => {
try {
let aboutPage = await AboutPage.findOne();
if (!aboutPage) aboutPage = new AboutPage();

if (aboutPage.hero) {
return res.status(400).json({ success: false, message: 'Hero already exists. Use updateHero to update.' });
}

const image = req.file ? await saveFile(req.file, 'hero') : req.body.image;
aboutPage.hero = {
title: req.body.title,
tag: req.body.tag || '',
description: req.body.description,
image: image || '',
isActive: req.body.isActive === 'true'
};
await aboutPage.save();

const baseUrl = `${req.protocol}://${req.get('host')}`;
res.status(201).json({ success: true, message: 'Hero created', data: addFullUrls(aboutPage.toObject(), baseUrl).hero });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Update Hero
export const updateHero = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.hero) {
return res.status(404).json({ success: false, message: 'Hero not found. Use createHero first.' });
}

const image = req.file ? await saveFile(req.file, 'hero') : req.body.image;
if (req.body.title) aboutPage.hero.title = req.body.title;
if (req.body.tag !== undefined) aboutPage.hero.tag = req.body.tag;
if (req.body.description) aboutPage.hero.description = req.body.description;
if (image) aboutPage.hero.image = image;
if (req.body.isActive !== undefined) aboutPage.hero.isActive = req.body.isActive === 'true';

await aboutPage.save();
const baseUrl = `${req.protocol}://${req.get('host')}`;
res.json({ success: true, message: 'Hero updated', data: addFullUrls(aboutPage.toObject(), baseUrl).hero });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Get Hero
export const getHero = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.hero) return res.status(404).json({ success: false, message: 'Hero not found' });
const baseUrl = `${req.protocol}://${req.get('host')}`;
res.json({ success: true, data: addFullUrls({ hero: aboutPage.hero }, baseUrl).hero });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Delete Hero
export const deleteHero = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage) return res.status(404).json({ success: false, message: 'About page not found' });
aboutPage.hero = undefined;
await aboutPage.save();
res.json({ success: true, message: 'Hero deleted' });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// ==================== ABOUT SECTION CRUD ====================

// Create About
export const createAbout = async (req, res) => {
try {
let aboutPage = await AboutPage.findOne();
if (!aboutPage) aboutPage = new AboutPage();

if (aboutPage.about) {
return res.status(400).json({ success: false, message: 'About section already exists. Use updateAbout to update.' });
}

const bgImage = req.file ? await saveFile(req.file, 'about') : req.body.bgImage;
aboutPage.about = {
title: req.body.title,
tag: req.body.tag,
description: req.body.description,
bgImage: bgImage || '',
isActive: req.body.isActive === 'true'
};
await aboutPage.save();

const baseUrl = `${req.protocol}://${req.get('host')}`;
res.status(201).json({ success: true, message: 'About section created', data: addFullUrls(aboutPage.toObject(), baseUrl).about });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Update About
export const updateAbout = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.about) {
return res.status(404).json({ success: false, message: 'About section not found. Use createAbout first.' });
}

const bgImage = req.file ? await saveFile(req.file, 'about') : req.body.bgImage;
if (req.body.title) aboutPage.about.title = req.body.title;
if (req.body.tag) aboutPage.about.tag = req.body.tag;
if (req.body.description) aboutPage.about.description = req.body.description;
if (bgImage) aboutPage.about.bgImage = bgImage;
if (req.body.isActive !== undefined) aboutPage.about.isActive = req.body.isActive === 'true';

await aboutPage.save();
const baseUrl = `${req.protocol}://${req.get('host')}`;
res.json({ success: true, message: 'About section updated', data: addFullUrls(aboutPage.toObject(), baseUrl).about });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Get About
export const getAbout = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.about) return res.status(404).json({ success: false, message: 'About section not found' });
const baseUrl = `${req.protocol}://${req.get('host')}`;
res.json({ success: true, data: addFullUrls({ about: aboutPage.about }, baseUrl).about });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Delete About
export const deleteAbout = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage) return res.status(404).json({ success: false, message: 'About page not found' });
aboutPage.about = undefined;
await aboutPage.save();
res.json({ success: true, message: 'About section deleted' });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// ==================== CARDS SECTION CRUD (Array) ====================

// Add Card
export const addCard = async (req, res) => {
try {
let aboutPage = await AboutPage.findOne();
if (!aboutPage) aboutPage = new AboutPage();
if (!aboutPage.cards) aboutPage.cards = [];

const image = req.file ? await saveFile(req.file, 'cards') : req.body.image;
aboutPage.cards.push({
title: req.body.title,
tag: req.body.tag,
description: req.body.description,
image: image || '',
isActive: req.body.isActive === 'true'
});
await aboutPage.save();

const baseUrl = `${req.protocol}://${req.get('host')}`;
const cardsWithUrls = aboutPage.cards.map(card => ({
...card.toObject(),
image: card.image && !card.image.startsWith('http') ? `${baseUrl}${card.image}` : card.image
}));
res.status(201).json({ success: true, message: 'Card added', data: cardsWithUrls });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Get All Cards
export const getAllCards = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.cards || aboutPage.cards.length === 0) {
return res.status(404).json({ success: false, message: 'No cards found' });
}
const baseUrl = `${req.protocol}://${req.get('host')}`;
const cardsWithUrls = aboutPage.cards.map(card => ({
...card.toObject(),
image: card.image && !card.image.startsWith('http') ? `${baseUrl}${card.image}` : card.image
}));
res.json({ success: true, data: cardsWithUrls });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Get Single Card by Index
export const getCardById = async (req, res) => {
try {
const { index } = req.params;
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.cards || index < 0 || index >= aboutPage.cards.length) {
return res.status(404).json({ success: false, message: 'Card not found' });
}
const baseUrl = `${req.protocol}://${req.get('host')}`;
const cardWithUrl = {
...aboutPage.cards[index].toObject(),
image: aboutPage.cards[index].image && !aboutPage.cards[index].image.startsWith('http') ? `${baseUrl}${aboutPage.cards[index].image}` : aboutPage.cards[index].image
};
res.json({ success: true, data: cardWithUrl });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Update Card
export const updateCard = async (req, res) => {
try {
const { index } = req.params;
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.cards || index < 0 || index >= aboutPage.cards.length) {
return res.status(404).json({ success: false, message: 'Card not found' });
}

const image = req.file ? await saveFile(req.file, 'cards') : req.body.image;
if (req.body.title) aboutPage.cards[index].title = req.body.title;
if (req.body.tag) aboutPage.cards[index].tag = req.body.tag;
if (req.body.description) aboutPage.cards[index].description = req.body.description;
if (image) aboutPage.cards[index].image = image;
if (req.body.isActive !== undefined) aboutPage.cards[index].isActive = req.body.isActive === 'true';

await aboutPage.save();
const baseUrl = `${req.protocol}://${req.get('host')}`;
const cardWithUrl = {
...aboutPage.cards[index].toObject(),
image: aboutPage.cards[index].image && !aboutPage.cards[index].image.startsWith('http') ? `${baseUrl}${aboutPage.cards[index].image}` : aboutPage.cards[index].image
};
res.json({ success: true, message: 'Card updated', data: cardWithUrl });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Delete Card
export const deleteCard = async (req, res) => {
try {
const { index } = req.params;
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.cards || index < 0 || index >= aboutPage.cards.length) {
return res.status(404).json({ success: false, message: 'Card not found' });
}
aboutPage.cards.splice(index, 1);
await aboutPage.save();
res.json({ success: true, message: 'Card deleted' });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// ==================== CORE VALUES SECTION CRUD ====================

// Create Core Values Section
export const createCoreValues = async (req, res) => {
try {
let aboutPage = await AboutPage.findOne();
if (!aboutPage) aboutPage = new AboutPage();

if (aboutPage.coreValues) {
return res.status(400).json({ success: false, message: 'Core values section already exists. Use updateCoreValues to update.' });
}

aboutPage.coreValues = {
title: req.body.title,
tag: req.body.tag,
values: req.body.values ? JSON.parse(req.body.values) : [],
isActive: req.body.isActive === 'true'
};
await aboutPage.save();

const baseUrl = `${req.protocol}://${req.get('host')}`;
res.status(201).json({ success: true, message: 'Core values section created', data: addFullUrls(aboutPage.toObject(), baseUrl).coreValues });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Update Core Values Section
export const updateCoreValues = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.coreValues) {
return res.status(404).json({ success: false, message: 'Core values section not found. Use createCoreValues first.' });
}

if (req.body.title) aboutPage.coreValues.title = req.body.title;
if (req.body.tag) aboutPage.coreValues.tag = req.body.tag;
if (req.body.values) aboutPage.coreValues.values = JSON.parse(req.body.values);
if (req.body.isActive !== undefined) aboutPage.coreValues.isActive = req.body.isActive === 'true';

await aboutPage.save();
const baseUrl = `${req.protocol}://${req.get('host')}`;
res.json({ success: true, message: 'Core values section updated', data: addFullUrls(aboutPage.toObject(), baseUrl).coreValues });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Get Core Values
export const getCoreValues = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.coreValues) return res.status(404).json({ success: false, message: 'Core values not found' });
const baseUrl = `${req.protocol}://${req.get('host')}`;
res.json({ success: true, data: addFullUrls({ coreValues: aboutPage.coreValues }, baseUrl).coreValues });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Add Core Value Item
export const addCoreValue = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage) return res.status(404).json({ success: false, message: 'About page not found' });
if (!aboutPage.coreValues) {
return res.status(404).json({ success: false, message: 'Core values section not found. Create it first.' });
}
if (!aboutPage.coreValues.values) aboutPage.coreValues.values = [];

aboutPage.coreValues.values.push({
title: req.body.title,
description: req.body.description,
icon: req.body.icon || '',
isActive: true
});
await aboutPage.save();

const baseUrl = `${req.protocol}://${req.get('host')}`;
const valuesWithUrls = aboutPage.coreValues.values.map(val => ({
...val,
icon: val.icon && !val.icon.startsWith('http') ? `${baseUrl}${val.icon}` : val.icon
}));
res.status(201).json({ success: true, message: 'Core value added', data: valuesWithUrls });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Get Single Core Value
export const getCoreValueById = async (req, res) => {
try {
const { index } = req.params;
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.coreValues || !aboutPage.coreValues.values || index < 0 || index >= aboutPage.coreValues.values.length) {
return res.status(404).json({ success: false, message: 'Core value not found' });
}
const baseUrl = `${req.protocol}://${req.get('host')}`;
const valueWithUrl = {
...aboutPage.coreValues.values[index],
icon: aboutPage.coreValues.values[index].icon && !aboutPage.coreValues.values[index].icon.startsWith('http') ? `${baseUrl}${aboutPage.coreValues.values[index].icon}` : aboutPage.coreValues.values[index].icon
};
res.json({ success: true, data: valueWithUrl });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Update Core Value Item
export const updateCoreValue = async (req, res) => {
try {
const { index } = req.params;
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.coreValues || !aboutPage.coreValues.values || index < 0 || index >= aboutPage.coreValues.values.length) {
return res.status(404).json({ success: false, message: 'Core value not found' });
}

if (req.body.title) aboutPage.coreValues.values[index].title = req.body.title;
if (req.body.description) aboutPage.coreValues.values[index].description = req.body.description;
if (req.body.icon) aboutPage.coreValues.values[index].icon = req.body.icon;
if (req.body.isActive !== undefined) aboutPage.coreValues.values[index].isActive = req.body.isActive === 'true';

await aboutPage.save();
const baseUrl = `${req.protocol}://${req.get('host')}`;
const valueWithUrl = {
...aboutPage.coreValues.values[index],
icon: aboutPage.coreValues.values[index].icon && !aboutPage.coreValues.values[index].icon.startsWith('http') ? `${baseUrl}${aboutPage.coreValues.values[index].icon}` : aboutPage.coreValues.values[index].icon
};
res.json({ success: true, message: 'Core value updated', data: valueWithUrl });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Delete Core Value Item
export const deleteCoreValue = async (req, res) => {
try {
const { index } = req.params;
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.coreValues || !aboutPage.coreValues.values || index < 0 || index >= aboutPage.coreValues.values.length) {
return res.status(404).json({ success: false, message: 'Core value not found' });
}
aboutPage.coreValues.values.splice(index, 1);
await aboutPage.save();
res.json({ success: true, message: 'Core value deleted' });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Delete Core Values Section
export const deleteCoreValues = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage) return res.status(404).json({ success: false, message: 'About page not found' });
aboutPage.coreValues = undefined;
await aboutPage.save();
res.json({ success: true, message: 'Core values section deleted' });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// ==================== WHY CHOOSE US SECTION CRUD ====================

// Create Why Choose Us Section
export const createWhyChooseUs = async (req, res) => {
try {
let aboutPage = await AboutPage.findOne();
if (!aboutPage) aboutPage = new AboutPage();

if (aboutPage.whyChooseUs) {
return res.status(400).json({ success: false, message: 'Why choose us section already exists. Use updateWhyChooseUs to update.' });
}

const image = req.file ? await saveFile(req.file, 'whychoose') : req.body.image;
aboutPage.whyChooseUs = {
title: req.body.title,
tag: req.body.tag,
description: req.body.description,
points: req.body.points ? JSON.parse(req.body.points) : [],
image: image || '',
isActive: req.body.isActive === 'true'
};
await aboutPage.save();

const baseUrl = `${req.protocol}://${req.get('host')}`;
res.status(201).json({ success: true, message: 'Why choose us section created', data: addFullUrls(aboutPage.toObject(), baseUrl).whyChooseUs });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Update Why Choose Us Section
export const updateWhyChooseUs = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.whyChooseUs) {
return res.status(404).json({ success: false, message: 'Why choose us section not found. Use createWhyChooseUs first.' });
}

const image = req.file ? await saveFile(req.file, 'whychoose') : req.body.image;
if (req.body.title) aboutPage.whyChooseUs.title = req.body.title;
if (req.body.tag) aboutPage.whyChooseUs.tag = req.body.tag;
if (req.body.description) aboutPage.whyChooseUs.description = req.body.description;
if (image) aboutPage.whyChooseUs.image = image;
if (req.body.points) aboutPage.whyChooseUs.points = JSON.parse(req.body.points);
if (req.body.isActive !== undefined) aboutPage.whyChooseUs.isActive = req.body.isActive === 'true';

await aboutPage.save();
const baseUrl = `${req.protocol}://${req.get('host')}`;
res.json({ success: true, message: 'Why choose us section updated', data: addFullUrls(aboutPage.toObject(), baseUrl).whyChooseUs });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Get Why Choose Us
export const getWhyChooseUs = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.whyChooseUs) return res.status(404).json({ success: false, message: 'Why choose us not found' });
const baseUrl = `${req.protocol}://${req.get('host')}`;
res.json({ success: true, data: addFullUrls({ whyChooseUs: aboutPage.whyChooseUs }, baseUrl).whyChooseUs });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Add Why Choose Point
export const addWhyChoosePoint = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.whyChooseUs) {
return res.status(404).json({ success: false, message: 'Why choose us section not found. Create it first.' });
}

aboutPage.whyChooseUs.points.push({ point: req.body.point, isActive: true });
await aboutPage.save();
res.status(201).json({ success: true, message: 'Point added', data: aboutPage.whyChooseUs.points });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Get Single Why Choose Point
export const getWhyChoosePointById = async (req, res) => {
try {
const { index } = req.params;
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.whyChooseUs || !aboutPage.whyChooseUs.points || index < 0 || index >= aboutPage.whyChooseUs.points.length) {
return res.status(404).json({ success: false, message: 'Point not found' });
}
res.json({ success: true, data: aboutPage.whyChooseUs.points[index] });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Update Why Choose Point
export const updateWhyChoosePoint = async (req, res) => {
try {
const { index } = req.params;
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.whyChooseUs || !aboutPage.whyChooseUs.points || index < 0 || index >= aboutPage.whyChooseUs.points.length) {
return res.status(404).json({ success: false, message: 'Point not found' });
}

if (req.body.point) aboutPage.whyChooseUs.points[index].point = req.body.point;
if (req.body.isActive !== undefined) aboutPage.whyChooseUs.points[index].isActive = req.body.isActive === 'true';

await aboutPage.save();
res.json({ success: true, message: 'Point updated', data: aboutPage.whyChooseUs.points[index] });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Delete Why Choose Point
export const deleteWhyChoosePoint = async (req, res) => {
try {
const { index } = req.params;
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.whyChooseUs || !aboutPage.whyChooseUs.points || index < 0 || index >= aboutPage.whyChooseUs.points.length) {
return res.status(404).json({ success: false, message: 'Point not found' });
}
aboutPage.whyChooseUs.points.splice(index, 1);
await aboutPage.save();
res.json({ success: true, message: 'Point deleted' });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Delete Why Choose Us Section
export const deleteWhyChooseUs = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage) return res.status(404).json({ success: false, message: 'About page not found' });
aboutPage.whyChooseUs = undefined;
await aboutPage.save();
res.json({ success: true, message: 'Why choose us section deleted' });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// ==================== CTA SECTION CRUD ====================

// Create CTA
export const createCta = async (req, res) => {
try {
let aboutPage = await AboutPage.findOne();
if (!aboutPage) aboutPage = new AboutPage();

if (aboutPage.cta) {
return res.status(400).json({ success: false, message: 'CTA already exists. Use updateCta to update.' });
}

aboutPage.cta = {
title: req.body.title,
tag: req.body.tag || '',
description: req.body.description,
isActive: req.body.isActive === 'true'
};
await aboutPage.save();

const baseUrl = `${req.protocol}://${req.get('host')}`;
res.status(201).json({ success: true, message: 'CTA created', data: addFullUrls(aboutPage.toObject(), baseUrl).cta });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Update CTA
export const updateCta = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.cta) {
return res.status(404).json({ success: false, message: 'CTA not found. Use createCta first.' });
}

if (req.body.title) aboutPage.cta.title = req.body.title;
if (req.body.tag !== undefined) aboutPage.cta.tag = req.body.tag;
if (req.body.description) aboutPage.cta.description = req.body.description;
if (req.body.isActive !== undefined) aboutPage.cta.isActive = req.body.isActive === 'true';

await aboutPage.save();
const baseUrl = `${req.protocol}://${req.get('host')}`;
res.json({ success: true, message: 'CTA updated', data: addFullUrls(aboutPage.toObject(), baseUrl).cta });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Get CTA
export const getCta = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage || !aboutPage.cta) return res.status(404).json({ success: false, message: 'CTA not found' });
const baseUrl = `${req.protocol}://${req.get('host')}`;
res.json({ success: true, data: addFullUrls({ cta: aboutPage.cta }, baseUrl).cta });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// Delete CTA
export const deleteCta = async (req, res) => {
try {
const aboutPage = await AboutPage.findOne();
if (!aboutPage) return res.status(404).json({ success: false, message: 'About page not found' });
aboutPage.cta = undefined;
await aboutPage.save();
res.json({ success: true, message: 'CTA deleted' });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};