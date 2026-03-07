// src/routes/adminRoutes.js
import { Router } from 'express';
import { approve, reject, getAdminStats } from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.put('/merchants/:id/approve', protect, authorize(Role.ADMIN), approve);
router.put('/merchants/:id/reject', protect, authorize(Role.ADMIN), reject);
router.get('/stats', protect, authorize(Role.ADMIN), getAdminStats);

export default router;
