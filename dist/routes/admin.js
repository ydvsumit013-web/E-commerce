"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Product_1 = __importDefault(require("../models/Product"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const redisService_1 = __importDefault(require("../services/redisService"));
const router = (0, express_1.Router)();
// All admin routes require auth + admin role
router.use(auth_1.protect, auth_1.adminOnly);
// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', async (_req, res) => {
    try {
        const [totalProducts, totalUsers, categoryBreakdown] = await Promise.all([
            Product_1.default.countDocuments(),
            User_1.default.countDocuments(),
            Product_1.default.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
                { $sort: { count: -1 } },
            ]),
        ]);
        const priceStats = await Product_1.default.aggregate([
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
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: String(err) });
    }
});
// ─── GET /api/admin/cache-stats ───────────────────────────────────────────────
router.get('/cache-stats', async (_req, res) => {
    try {
        const info = await redisService_1.default.info('stats');
        const lines = info.split('\r\n');
        const getLine = (key) => {
            const line = lines.find((l) => l.startsWith(key));
            return line ? line.split(':')[1] : '0';
        };
        const hits = parseInt(getLine('keyspace_hits') || '0');
        const misses = parseInt(getLine('keyspace_misses') || '0');
        const total = hits + misses;
        const hitRate = total > 0 ? ((hits / total) * 100).toFixed(1) : '0';
        const keys = await redisService_1.default.keys('products:*');
        res.json({
            hits,
            misses,
            total,
            hitRate: `${hitRate}%`,
            cachedKeys: keys,
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Redis stats error', error: String(err) });
    }
});
// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', async (_req, res) => {
    try {
        const users = await User_1.default.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: String(err) });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map