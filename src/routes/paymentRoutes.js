// src/routes/paymentRoutes.js
import { Router } from 'express';
import { webhook } from '../controllers/paymentController.js';

const router = Router();

router.post('/webhook', webhook);

export default router;
