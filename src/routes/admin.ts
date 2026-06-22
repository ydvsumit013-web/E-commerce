import { Router, Response } from 'express';
import Product from '../models/Product';
import User from '../models/User';
import { protect, adminOnly, AuthRequest } from '../middleware/auth';
import redisClient from '../services/redisService';

const router = Router();

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const [totalProducts, totalUsers, categoryBreakdown] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments(),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const priceStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          totalStock: { $sum: '$stock' },
        },
      },
    ]);

    res.json({
      totalProducts,
      totalUsers,
      categoryBreakdown,
      priceStats: priceStats[0] || {},
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

// ─── GET /api/admin/cache-stats ───────────────────────────────────────────────
router.get('/cache-stats', async (_req: AuthRequest, res: Response) => {
  try {
    const info = await redisClient.info('stats');
    const lines = info.split('\r\n');
    const getLine = (key: string) => {
      const line = lines.find((l) => l.startsWith(key));
      return line ? line.split(':')[1] : '0';
    };

    const hits = parseInt(getLine('keyspace_hits') || '0');
    const misses = parseInt(getLine('keyspace_misses') || '0');
    const total = hits + misses;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(1) : '0';

    const keys = await redisClient.keys('products:*');

    res.json({
      hits,
      misses,
      total,
      hitRate: `${hitRate}%`,
      cachedKeys: keys,
    });
  } catch (err) {
    res.status(500).json({ message: 'Redis stats error', error: String(err) });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

export default router;
