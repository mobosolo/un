// src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import merchantRoutes from './routes/merchantRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import basketRoutes from './routes/basketRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import errorMiddleware from './middlewares/errorMiddleware.js';


dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(
  express.json({
    verify: (req, res, buf) => {
      if ((req.originalUrl || req.url || "").includes("/api/payments/webhook")) {
        req.rawBody = buf;
      }
    },
  })
); // To parse JSON bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/baskets', basketRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);


// Basic route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Global Error Handler Middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

export default app;
