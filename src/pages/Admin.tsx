import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../lib/api';
import { Edit2, Save, X, Trash2, Plus, RefreshCw, Database, Users, TrendingUp, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  _id: string; name: string; price: number; category: string;
  stock: number; brand: string; rating: number; imageUrl: string;
}
interface Stats {
  totalProducts: number; totalUsers: number;
  categoryBreakdown: { _id: string; count: number; avgPrice: number }[];
  priceStats: { avgPrice: number; minPrice: number; maxPrice: number; totalStock: number };
}
interface CacheStats {
  hits: number; misses: number; total: number; hitRate: string; cachedKeys: string[];
}

export default function Admin() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'products' | 'stats' | 'cache'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Product>>({});
  const [lastInvalidation, setLastInvalidation] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Electronics', stock: '', brand: '', description: '', imageUrl: '' });

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
  }, [user, navigate]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/products', { params: { limit: 50 } });
      setProducts(res.data.products);
    } finally { setIsLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    const res = await api.get('/admin/stats');
    setStats(res.data);
  }, []);

  const fetchCacheStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/cache-stats');
      setCacheStats(res.data);
    } catch { setCacheStats(null); }
  }, []);

  useEffect(() => {
    if (tab === 'products') fetchProducts();
    if (tab === 'stats') fetchStats();
    if (tab === 'cache') fetchCacheStats();
  }, [tab, fetchProducts, fetchStats, fetchCacheStats]);

  const startEdit = (p: Product) => { setEditingId(p._id); setEditData({ price: p.price, stock: p.stock, name: p.name }); };
  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async (id: string) => {
    try {
      const res = await api.put(`/products/${id}`, editData);
      const invalidated = res.headers['x-cache-invalidated'];
      if (invalidated) setLastInvalidation(`Cache invalidated after editing "${editData.name || 'product'}" at ${new Date().toLocaleTimeString()}`);
      toast.success('Product updated — cache invalidated!');
      cancelEdit();
      fetchProducts();
    } catch { toast.error('Update failed'); }
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await api.delete(`/products/${id}`);
    toast.success('Product deleted');
    fetchProducts();
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        tags: [],
        rating: 4.0,
        numReviews: 0,
        sku: `SKU-NEW-${Date.now()}`,
      });
      toast.success('Product added & cache invalidated!');
      setAddMode(false);
      setNewProduct({ name: '', price: '', category: 'Electronics', stock: '', brand: '', description: '', imageUrl: '' });
      fetchProducts();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add');
    }
  };

  const TABS = [
    { id: 'products', label: 'Products', icon: <Database size={15} /> },
    { id: 'stats', label: 'Stats', icon: <TrendingUp size={15} /> },
    { id: 'cache', label: 'Cache', icon: <Zap size={15} /> },
  ] as const;

  return (
    <div className="fade-in" style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Manage products, monitor cache behaviour in real-time
        </p>
      </div>

      {/* Cache invalidation notice */}
      {lastInvalidation && (
        <div style={{
          background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: '0.75rem', padding: '0.75rem 1.25rem', marginBottom: '1.5rem',
          fontSize: '0.875rem', color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <Zap size={14} /> {lastInvalidation} — next GET will be a <strong>CACHE MISS</strong>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="btn"
            style={{
              padding: '0.5rem 1.25rem',
              background: tab === t.id ? 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' : 'transparent',
              color: tab === t.id ? 'white' : 'var(--color-text-secondary)',
              border: tab === t.id ? 'none' : '1px solid var(--color-border)',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Products Tab ── */}
      {tab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{products.length} products shown (limit 50)</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={fetchProducts} className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem' }}>
                <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <button onClick={() => setAddMode(!addMode)} className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>
                <Plus size={14} /> Add Product
              </button>
            </div>
          </div>

          {/* Add product form */}
          {addMode && (
            <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>New Product</h3>
              <form onSubmit={addProduct}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  {['name', 'brand', 'price', 'stock'].map((field) => (
                    <input
                      key={field}
                      type={field === 'price' || field === 'stock' ? 'number' : 'text'}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      className="input"
                      value={newProduct[field as keyof typeof newProduct]}
                      onChange={(e) => setNewProduct({ ...newProduct, [field]: e.target.value })}
                      required
                      min={0}
                      style={{ fontSize: '0.875rem' }}
                    />
                  ))}
                  <input className="input" placeholder="Image URL" style={{ fontSize: '0.875rem' }}
                    value={newProduct.imageUrl} onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })} />
                  <select
                    className="input"
                    style={{ fontSize: '0.875rem' }}
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  >
                    {['Electronics','Clothing','Books','Home & Garden','Sports','Toys','Beauty','Automotive'].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  placeholder="Description"
                  className="input"
                  style={{ fontSize: '0.875rem', resize: 'vertical', minHeight: '80px' }}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  required
                />
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary"><Save size={14} /> Save</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setAddMode(false)}><X size={14} /> Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Product table */}
          <div className="glass" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid rgba(51,65,85,0.4)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(51,65,85,0.3)' )}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent' )}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src={p.imageUrl} alt={p.name}
                          style={{ width: '40px', height: '40px', borderRadius: '0.5rem', objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${p._id}/40/40`; }} />
                        <div>
                          {editingId === p._id
                            ? <input className="input" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                            : <p style={{ fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                          }
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)',
                        color: '#38bdf8', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.6rem' }}>
                        {p.category}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {editingId === p._id
                        ? <input type="number" className="input" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', width: '90px' }}
                            value={editData.price || ''} onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })} />
                        : <span style={{ fontWeight: 700 }}>${p.price.toFixed(2)}</span>
                      }
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {editingId === p._id
                        ? <input type="number" className="input" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', width: '80px' }}
                            value={editData.stock || ''} onChange={(e) => setEditData({ ...editData, stock: parseInt(e.target.value) })} />
                        : <span style={{ color: p.stock === 0 ? '#f97316' : p.stock < 10 ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                            {p.stock}
                          </span>
                      }
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#f59e0b', fontWeight: 600 }}>★ {p.rating.toFixed(1)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {editingId === p._id ? (
                          <>
                            <button onClick={() => saveEdit(p._id)} className="btn btn-primary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}>
                              <Save size={12} /> Save
                            </button>
                            <button onClick={cancelEdit} className="btn btn-ghost" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}>
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(p)} className="btn btn-ghost" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}>
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => deleteProduct(p._id, p.name)} className="btn btn-ghost"
                              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', color: '#f97316' }}>
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Stats Tab ── */}
      {tab === 'stats' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Total Products', value: stats.totalProducts.toLocaleString(), icon: <Database size={20} color="#38bdf8" /> },
              { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: <Users size={20} color="#a78bfa" /> },
              { label: 'Avg Price', value: `$${stats.priceStats.avgPrice?.toFixed(2) || '0'}`, icon: <TrendingUp size={20} color="#22c55e" /> },
              { label: 'Total Stock', value: stats.priceStats.totalStock?.toLocaleString() || '0', icon: <Database size={20} color="#f59e0b" /> },
            ].map((s) => (
              <div key={s.label} className="glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {s.icon}
                <div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{s.label}</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Products by Category</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.categoryBreakdown.map((cat) => {
                const pct = ((cat.count / stats.totalProducts) * 100).toFixed(1);
                return (
                  <div key={cat._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 600 }}>{cat._id}</span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{cat.count} products · avg ${cat.avgPrice?.toFixed(2)}</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', background: 'var(--color-surface-3)' }}>
                      <div style={{ height: '100%', borderRadius: '3px', width: `${pct}%`, background: 'linear-gradient(90deg, #0ea5e9, #8b5cf6)', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Cache Tab ── */}
      {tab === 'cache' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={fetchCacheStats} className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {cacheStats ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'Hit Rate', value: cacheStats.hitRate, color: '#22c55e' },
                  { label: 'Cache Hits', value: cacheStats.hits.toLocaleString(), color: '#22c55e' },
                  { label: 'Cache Misses', value: cacheStats.misses.toLocaleString(), color: '#f97316' },
                  { label: 'Total Requests', value: cacheStats.total.toLocaleString(), color: '#38bdf8' },
                ].map((s) => (
                  <div key={s.label} className="glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{s.label}</p>
                    <p style={{ fontSize: '2rem', fontWeight: 900, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="glass" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>
                  <Zap size={16} style={{ display: 'inline', marginRight: '0.4rem', color: '#38bdf8' }} />
                  Active Cache Keys ({cacheStats.cachedKeys.length})
                </h3>
                {cacheStats.cachedKeys.length === 0 ? (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No active keys. Browse products to populate cache.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {cacheStats.cachedKeys.map((key) => (
                      <span key={key} style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)',
                        borderRadius: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#38bdf8' }}>
                        {key}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Cache-Aside Flow</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
                  {['GET /api/products', '→ Check Redis', cacheStats.hits > cacheStats.misses ? '✅ HIT → Return (~4ms)' : '❌ MISS → Query MongoDB → Store → Return (~240ms)',
                    '→ Admin PUT', '→ DEL products:page:*', '→ Next GET: MISS again'].map((step, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ background: 'rgba(51,65,85,0.5)', borderRadius: '0.5rem', padding: '0.3rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {step}
                      </span>
                      {i < 5 && <span style={{ color: 'var(--color-text-secondary)' }}>→</span>}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <Zap size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>Redis not connected or stats unavailable.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Start your Redis server and refresh.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
