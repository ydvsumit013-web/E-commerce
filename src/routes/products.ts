import { Router, Response, Request } from 'express';
import Product from '../models/Product';
import { protect, adminOnly, AuthRequest } from '../middleware/auth';
import { getCache, setCache, deleteCachePattern } from '../services/redisService';

const router = Router();

const PRODUCTS_ALL_KEY = 'products:all';
const PRODUCTS_PAGE_KEY = (page: number, cat: string, sort: string) =>
  `products:page:${page}:cat:${cat}:sort:${sort}`;
const PRODUCT_KEY = (id: string) => `product:${id}`;

// ─── GET /api/products ────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  const start = Date.now();
  const { page = '1', limit = '20', category = 'all', sort = 'createdAt' } = req.query;
  const q = req.query.q ? String(req.query.q) : undefined;

  try {
    // Search bypasses cache for freshness
    if (q) {
      const results = await Product.find(
        { $text: { $search: String(q) } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(50);

      res.setHeader('X-Cache', 'BYPASS');
      res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
      res.json({ products: results, total: results.length, cached: false });
      return;
    }

    const cacheKey = PRODUCTS_PAGE_KEY(Number(page), String(category), String(sort));
    const cached = await getCache(cacheKey);

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

    const filter: Record<string, unknown> = {};
    if (category !== 'all') filter.category = category;

    const sortObj: Record<string, 1 | -1> = {};
    if (sort === 'price_asc') sortObj.price = 1;
    else if (sort === 'price_desc') sortObj.price = -1;
    else if (sort === 'rating') sortObj.rating = -1;
    else sortObj.createdAt = -1;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    const payload = { products, total, page: pageNum, pages: Math.ceil(total / limitNum) };

    // Store in Redis with 5-minute TTL
    await setCache(cacheKey, JSON.stringify(payload), 300);

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
    res.json({ ...payload, cached: false });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

// ─── GET /api/products/categories ────────────────────────────────────────────
router.get('/categories', async (_req: Request, res: Response) => {
  const cached = await getCache('products:categories');
  if (cached) {
    res.json(JSON.parse(cached));
    return;
  }
  const categories = await Product.distinct('category');
  await setCache('products:categories', JSON.stringify(categories), 3600);
  res.json(categories);
});

// ─── GET /api/products/:id ────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const key = PRODUCT_KEY(String(req.params.id));
    const cached = await getCache(key);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
      res.json({ product: JSON.parse(cached), cached: true });
      return;
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    await setCache(key, JSON.stringify(product), 600);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
    res.json({ product, cached: false });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

// ─── POST /api/products (admin) ───────────────────────────────────────────────
router.post('/', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.create(req.body);
    // Invalidate all product list caches
    await deleteCachePattern('products:page:*');
    await deleteCachePattern('products:categories');
    res.status(201).json({ product });
  } catch (err) {
    res.status(400).json({ message: 'Validation error', error: String(err) });
  }
});

// ─── PUT /api/products/:id (admin) ────────────────────────────────────────────
router.put('/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  const start = Date.now();
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // ← Cache Invalidation: delete this product + all list caches
    await deleteCachePattern('products:page:*');
    await deleteCachePattern(`product:${req.params.id}`);

    res.setHeader('X-Cache-Invalidated', 'true');
    res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
    res.json({ product, cacheInvalidated: true });
  } catch (err) {
    res.status(400).json({ message: 'Update error', error: String(err) });
  }
});

// ─── DELETE /api/products/:id (admin) ─────────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    await deleteCachePattern('products:page:*');
    await deleteCachePattern(`product:${req.params.id}`);
    res.json({ message: 'Product deleted', cacheInvalidated: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

export { PRODUCTS_ALL_KEY };
export default router;
