import express from 'express';
import multer from 'multer';
import {
getAboutPage,
createAboutPage,
updateAboutPage,
deleteAboutPage,
createHero,
updateHero,
getHero,
deleteHero,
createAbout,
updateAbout,
getAbout,
deleteAbout,
addCard,
getAllCards,
getCardById,
updateCard,
deleteCard,
createCoreValues,
updateCoreValues,
getCoreValues,
addCoreValue,
getCoreValueById,
updateCoreValue,
deleteCoreValue,
deleteCoreValues,
createWhyChooseUs,
updateWhyChooseUs,
getWhyChooseUs,
addWhyChoosePoint,
getWhyChoosePointById,
updateWhyChoosePoint,
deleteWhyChoosePoint,
deleteWhyChooseUs,
createCta,
updateCta,
getCta,
deleteCta
} from '../controllers/aboutpage.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// ==================== PUBLIC ====================
router.get('/', getAboutPage);

// ==================== FULL PAGE CRUD ====================
router.post('/', createAboutPage);
router.put('/', updateAboutPage);
router.delete('/', deleteAboutPage);

// ==================== HERO CRUD ====================
router.post('/hero', upload.single('image'), createHero);
router.put('/hero', upload.single('image'), updateHero);
router.get('/hero', getHero);
router.delete('/hero', deleteHero);

// ==================== ABOUT CRUD ====================
router.post('/about', upload.single('bgImage'), createAbout);
router.put('/about', upload.single('bgImage'), updateAbout);
router.get('/about', getAbout);
router.delete('/about', deleteAbout);

// ==================== CARDS CRUD ====================
router.post('/cards', upload.single('image'), addCard);
router.get('/cards', getAllCards);
router.get('/cards/:index', getCardById);
router.put('/cards/:index', upload.single('image'), updateCard);
router.delete('/cards/:index', deleteCard);

// ==================== CORE VALUES CRUD ====================
router.post('/core-values', createCoreValues);
router.put('/core-values', updateCoreValues);
router.get('/core-values', getCoreValues);
router.post('/core-values/add', addCoreValue);
router.get('/core-values/:index', getCoreValueById);
router.put('/core-values/:index', updateCoreValue);
router.delete('/core-values/:index', deleteCoreValue);
router.delete('/core-values', deleteCoreValues);

// ==================== WHY CHOOSE US CRUD ====================
router.post('/why-choose-us', upload.single('image'), createWhyChooseUs);
router.put('/why-choose-us', upload.single('image'), updateWhyChooseUs);
router.get('/why-choose-us', getWhyChooseUs);
router.post('/why-choose-us/points', addWhyChoosePoint);
router.get('/why-choose-us/points/:index', getWhyChoosePointById);
router.put('/why-choose-us/points/:index', updateWhyChoosePoint);
router.delete('/why-choose-us/points/:index', deleteWhyChoosePoint);
router.delete('/why-choose-us', deleteWhyChooseUs);

// ==================== CTA CRUD ====================
router.post('/cta', createCta);
router.put('/cta', updateCta);
router.get('/cta', getCta);
router.delete('/cta', deleteCta);

export default router;