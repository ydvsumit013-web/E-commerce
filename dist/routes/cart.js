"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Cart_1 = __importDefault(require("../models/Cart"));
const Product_1 = __importDefault(require("../models/Product"));
const auth_1 = require("../middleware/auth");
const redisService_1 = require("../services/redisService");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)();
const DISCOUNT_CODES = {
    SAVE10: 10,
    WELCOME20: 20,
    FLASH30: 30,
};
const cartCacheKey = (userId) => `cart:${userId}`;
// ─── GET /api/cart ─────────────────────────────────────────────────────────────
router.get('/', auth_1.protect, async (req, res) => {
    try {
        const key = cartCacheKey(req.user.id);
        const cached = await (0, redisService_1.getCache)(key);
        if (cached) {
            res.setHeader('X-Cache', 'HIT');
            res.json(JSON.parse(cached));
            return;
        }
        // Aggregation pipeline: join products, compute totals
        const result = await Cart_1.default.aggregate([
            { $match: { user: new mongoose_1.default.Types.ObjectId(req.user.id) } },
            { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'items.productDetails',
                },
            },
            { $unwind: { path: '$items.productDetails', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$_id',
                    user: { $first: '$user' },
                    discountCode: { $first: '$discountCode' },
                    discountPercent: { $first: '$discountPercent' },
                    items: {
                        $push: {
                            product: '$items.product',
                            quantity: '$items.quantity',
                            price: '$items.price',
                            name: '$items.productDetails.name',
                            imageUrl: '$items.productDetails.imageUrl',
                            stock: '$items.productDetails.stock',
                        },
                    },
                    subtotal: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                },
            },
            {
                $addFields: {
                    discountAmount: {
                        $multiply: ['$subtotal', { $divide: ['$discountPercent', 100] }],
                    },
                    total: {
                        $multiply: [
                            '$subtotal',
                            { $subtract: [1, { $divide: ['$discountPercent', 100] }] },
                        ],
                    },
                    itemCount: { $size: '$items' },
                },
            },
        ]);
        const cart = result[0] || { items: [], subtotal: 0, discountAmount: 0, total: 0, itemCount: 0 };
        await (0, redisService_1.setCache)(key, JSON.stringify(cart), 1800);
        res.setHeader('X-Cache', 'MISS');
        res.json(cart);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: String(err) });
    }
});
// ─── POST /api/cart/add ────────────────────────────────────────────────────────
router.post('/add', auth_1.protect, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const product = await Product_1.default.findById(productId);
        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }
        if (product.stock < quantity) {
            res.status(400).json({ message: `Only ${product.stock} in stock` });
            return;
        }
        let cart = await Cart_1.default.findOne({ user: req.user.id });
        if (!cart) {
            cart = await Cart_1.default.create({ user: req.user.id, items: [] });
        }
        const existingItem = cart.items.find((i) => String(i.product) === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        }
        else {
            cart.items.push({ product: new mongoose_1.default.Types.ObjectId(productId), quantity, price: product.price });
        }
        await cart.save();
        await (0, redisService_1.deleteCache)(cartCacheKey(req.user.id));
        res.json({ message: 'Added to cart', cart });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: String(err) });
    }
});
// ─── DELETE /api/cart/item/:productId ─────────────────────────────────────────
router.delete('/item/:productId', auth_1.protect, async (req, res) => {
    try {
        const cart = await Cart_1.default.findOne({ user: req.user.id });
        if (!cart) {
            res.status(404).json({ message: 'Cart not found' });
            return;
        }
        cart.items = cart.items.filter((i) => String(i.product) !== req.params.productId);
        await cart.save();
        await (0, redisService_1.deleteCache)(cartCacheKey(req.user.id));
        res.json({ message: 'Item removed', cart });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: String(err) });
    }
});
// ─── POST /api/cart/apply-discount ────────────────────────────────────────────
router.post('/apply-discount', auth_1.protect, async (req, res) => {
    try {
        const { code } = req.body;
        const percent = DISCOUNT_CODES[String(code).toUpperCase()];
        if (!percent) {
            res.status(400).json({ message: 'Invalid discount code' });
            return;
        }
        const cart = await Cart_1.default.findOneAndUpdate({ user: req.user.id }, { discountCode: code.toUpperCase(), discountPercent: percent }, { new: true, upsert: true });
        await (0, redisService_1.deleteCache)(cartCacheKey(req.user.id));
        res.json({ message: `Discount applied: ${percent}% off`, cart });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: String(err) });
    }
});
// ─── DELETE /api/cart ─────────────────────────────────────────────────────────
router.delete('/', auth_1.protect, async (req, res) => {
    try {
        await Cart_1.default.findOneAndDelete({ user: req.user.id });
        await (0, redisService_1.deleteCache)(cartCacheKey(req.user.id));
        res.json({ message: 'Cart cleared' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: String(err) });
    }
});
exports.default = router;
//# sourceMappingURL=cart.js.map