// src/routes/uploadRoutes.js
import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/uploadController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', protect, upload.single('file'), uploadImage);

export default router;
