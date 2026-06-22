"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRODUCTS_ALL_KEY = void 0;
const express_1 = require("express");
const Product_1 = __importDefault(require("../models/Product"));
const auth_1 = require("../middleware/auth");
const redisService_1 = require("../services/redisService");
const router = (0, express_1.Router)();
const PRODUCTS_ALL_KEY = 'products:all';
exports.PRODUCTS_ALL_KEY = PRODUCTS_ALL_KEY;
const PRODUCTS_PAGE_KEY = (page, cat, sort) => `products:page:${page}:cat:${cat}:sort:${sort}`;
const PRODUCT_KEY = (id) => `product:${id}`;
// ─── GET /api/products ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    const start = Date.now();
    const { page = '1', limit = '20', category = 'all', sort = 'createdAt' } = req.query;
    const q = req.query.q ? String(req.query.q) : undefined;
    try {
        // Search bypasses cache for freshness
        if (q) {
            const results = await Product_1.default.find({ $text: { $search: String(q) } }, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } })
                .limit(50);
            res.setHeader('X-Cache', 'BYPASS');
            res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
            res.json({ products: results, total: results.length, cached: false });
            return;
        }
        const cacheKey = PRODUCTS_PAGE_KEY(Number(page), String(category), String(sort));
        const cached = await (0, redisService_1.getCache)(cacheKey);
        if (cached) {
            res.setHeader('X-Cache', 'HIT');
            res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
            res.json({ ...JSON.parse(cached), cached: true });
            return;
        }
        // Cache MISS — query MongoDB
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Number(limit));
        const skip = (pageNum - 1) * limitNum;
        const filter = {};
        if (category !== 'all')
            filter.category = category;
        const sortObj = {};
        if (sort === 'price_asc')
            sortObj.price = 1;
        else if (sort === 'price_desc')
            sortObj.price = -1;
        else if (sort === 'rating')
            sortObj.rating = -1;
        else
            sortObj.createdAt = -1;
        const [products, total] = await Promise.all([
            Product_1.default.find(filter).sort(sortObj).skip(skip).limit(limitNum),
            Product_1.default.countDocuments(filter),
        ]);
        const payload = { products, total, page: pageNum, pages: Math.ceil(total / limitNum) };
        // Store in Redis with 5-minute TTL
        await (0, redisService_1.setCache)(cacheKey, JSON.stringify(payload), 300);
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
        res.json({ ...payload, cached: false });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: String(err) });
    }
});
// ─── GET /api/products/categories ────────────────────────────────────────────
router.get('/categories', async (_req, res) => {
    const cached = await (0, redisService_1.getCache)('products:categories');
    if (cached) {
        res.json(JSON.parse(cached));
        return;
    }
    const categories = await Product_1.default.distinct('category');
    await (0, redisService_1.setCache)('products:categories', JSON.stringify(categories), 3600);
    res.json(categories);
});
// ─── GET /api/products/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    const start = Date.now();
    try {
        const key = PRODUCT_KEY(String(req.params.id));
        const cached = await (0, redisService_1.getCache)(key);
        if (cached) {
            res.setHeader('X-Cache', 'HIT');
            res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
            res.json({ product: JSON.parse(cached), cached: true });
            return;
        }
        const product = await Product_1.default.findById(req.params.id);
        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }
        await (0, redisService_1.setCache)(key, JSON.stringify(product), 600);
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
        res.json({ product, cached: false });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: String(err) });
    }
});
// ─── POST /api/products (admin) ───────────────────────────────────────────────
router.post('/', auth_1.protect, auth_1.adminOnly, async (req, res) => {
    try {
        const product = await Product_1.default.create(req.body);
        // Invalidate all product list caches
        await (0, redisService_1.deleteCachePattern)('products:page:*');
        await (0, redisService_1.deleteCachePattern)('products:categories');
        res.status(201).json({ product });
    }
    catch (err) {
        res.status(400).json({ message: 'Validation error', error: String(err) });
    }
});
// ─── PUT /api/products/:id (admin) ────────────────────────────────────────────
router.put('/:id', auth_1.protect, auth_1.adminOnly, async (req, res) => {
    const start = Date.now();
    try {
        const product = await Product_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }
        // ← Cache Invalidation: delete this product + all list caches
        await (0, redisService_1.deleteCachePattern)('products:page:*');
        await (0, redisService_1.deleteCachePattern)(`product:${req.params.id}`);
        res.setHeader('X-Cache-Invalidated', 'true');
        res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
        res.json({ product, cacheInvalidated: true });
    }
    catch (err) {
        res.status(400).json({ message: 'Update error', error: String(err) });
    }
});
// ─── DELETE /api/products/:id (admin) ─────────────────────────────────────────
router.delete('/:id', auth_1.protect, auth_1.adminOnly, async (req, res) => {
    try {
        const product = await Product_1.default.findByIdAndDelete(req.params.id);
        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }
        await (0, redisService_1.deleteCachePattern)('products:page:*');
        await (0, redisService_1.deleteCachePattern)(`product:${req.params.id}`);
        res.json({ message: 'Product deleted', cacheInvalidated: true });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: String(err) });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map