// src/routes/adminRoutes.js
import { Router } from 'express';
import { approve, reject, getAdminStats, getMerchants, getUsers } from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import prismaPkg from '@prisma/client';

const router = Router();
const { Role } = prismaPkg;

router.put('/merchants/:id/approve', protect, authorize(Role.ADMIN), approve);
router.put('/merchants/:id/reject', protect, authorize(Role.ADMIN), reject);
router.get('/merchants', protect, authorize(Role.ADMIN), getMerchants);
router.get('/users', protect, authorize(Role.ADMIN), getUsers);
router.get('/stats', protect, authorize(Role.ADMIN), getAdminStats);

export default router;

