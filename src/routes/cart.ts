import { Router, Response } from 'express';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { protect, AuthRequest } from '../middleware/auth';
import { getCache, setCache, deleteCache } from '../services/redisService';
import mongoose from 'mongoose';

const router = Router();
const DISCOUNT_CODES: Record<string, number> = {
  SAVE10: 10,
  WELCOME20: 20,
  FLASH30: 30,
};

const cartCacheKey = (userId: string) => `cart:${userId}`;

// ─── GET /api/cart ─────────────────────────────────────────────────────────────
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const key = cartCacheKey(req.user!.id);
    const cached = await getCache(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(JSON.parse(cached));
      return;
    }

    // Aggregation pipeline: join products, compute totals
    const result = await Cart.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user!.id) } },
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
    await setCache(key, JSON.stringify(cart), 1800);
    res.setHeader('X-Cache', 'MISS');
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

// ─── POST /api/cart/add ────────────────────────────────────────────────────────
router.post('/add', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    if (product.stock < quantity) {
      res.status(400).json({ message: `Only ${product.stock} in stock` });
      return;
    }

    let cart = await Cart.findOne({ user: req.user!.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user!.id, items: [] });
    }

    const existingItem = cart.items.find((i) => String(i.product) === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: new mongoose.Types.ObjectId(productId), quantity, price: product.price });
    }

    await cart.save();
    await deleteCache(cartCacheKey(req.user!.id));
    res.json({ message: 'Added to cart', cart });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

// ─── DELETE /api/cart/item/:productId ─────────────────────────────────────────
router.delete('/item/:productId', protect, async (req: AuthRequest, res: Response) => {
  try {
    const cart = await Cart.findOne({ user: req.user!.id });
    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }
    cart.items = cart.items.filter((i) => String(i.product) !== req.params.productId);
    await cart.save();
    await deleteCache(cartCacheKey(req.user!.id));
    res.json({ message: 'Item removed', cart });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

// ─── POST /api/cart/apply-discount ────────────────────────────────────────────
router.post('/apply-discount', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    const percent = DISCOUNT_CODES[String(code).toUpperCase()];
    if (!percent) {
      res.status(400).json({ message: 'Invalid discount code' });
      return;
    }

    const cart = await Cart.findOneAndUpdate(
      { user: req.user!.id },
      { discountCode: code.toUpperCase(), discountPercent: percent },
      { new: true, upsert: true }
    );

    await deleteCache(cartCacheKey(req.user!.id));
    res.json({ message: `Discount applied: ${percent}% off`, cart });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

// ─── DELETE /api/cart ─────────────────────────────────────────────────────────
router.delete('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    await Cart.findOneAndDelete({ user: req.user!.id });
    await deleteCache(cartCacheKey(req.user!.id));
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

export default router;
