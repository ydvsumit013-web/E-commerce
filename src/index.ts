import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectRedis } from './services/redisService';
import { startMongoMemoryServer } from './services/mongoMemoryDb';
import { responseTime } from './middleware/responseTime';

// Routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ exposedHeaders: ['X-Cache', 'X-Response-Time', 'X-Cache-Invalidated'] }));
app.use(express.json());
app.use(responseTime);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await startMongoMemoryServer();
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ MongoDB connected');

    await connectRedis();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
};

start();
