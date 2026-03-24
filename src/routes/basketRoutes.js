// src/routes/basketRoutes.js
import { Router } from 'express';
import { body } from 'express-validator';
import { create, getAll, getOne, update, remove, quickUpdate, duplicate } from '../controllers/basketController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import prismaPkg from '@prisma/client';

const router = Router();
const { Role, Category, BasketStatus } = prismaPkg;

const basketValidation = [
  body('title').notEmpty().withMessage('Le titre est requis'),
  body('description').optional().isString(),
  body('category').isIn(Object.values(Category)).withMessage('Catégorie invalide'),
  body('originalPrice').isInt({ gt: 0 }).withMessage('Le prix original doit être un entier positif'),
  body('discountedPrice').isInt({ gt: 0 }).withMessage('Le prix réduit doit être un entier positif'),
  body('quantity').isInt({ gt: 0 }).withMessage('La quantité doit être un entier positif'),
  body('pickupTimeStart').isISO8601().withMessage('Date de début de ramassage invalide'),
  body('pickupTimeEnd').isISO8601().withMessage('Date de fin de ramassage invalide'),
  body('photoURL').optional().isURL().withMessage('URL de photo invalide'),
];

router.post('/', protect, authorize(Role.MERCHANT), basketValidation, create);
router.get('/', getAll);
router.get('/:id', getOne);
router.put('/:id', protect, authorize(Role.MERCHANT), basketValidation, update);
router.patch(
  '/:id/quick',
  protect,
  authorize(Role.MERCHANT),
  [
    body('delta').optional().isInt().withMessage('Delta invalide'),
    body('shiftMinutes').optional().isInt().withMessage('Decalage invalide'),
    body('status').optional().isIn(Object.values(BasketStatus)).withMessage('Statut invalide'),
  ],
  quickUpdate
);
router.post('/:id/duplicate', protect, authorize(Role.MERCHANT), duplicate);
router.delete('/:id', protect, authorize([Role.MERCHANT, Role.ADMIN]), remove);

export default router;

