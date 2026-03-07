// src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, JWT_SECRET);

      req.user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          displayName: true,
          phoneNumber: true,
          role: true,
          latitude: true,
          longitude: true,
        },
      });

      if (!req.user) {
        return res.status(401).json({ message: 'Non autorisé, utilisateur introuvable.' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Non autorisé, token invalide.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Non autorisé, pas de token.' });
  }
};

export const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès interdit.' });
    }
    next();
  };
};
