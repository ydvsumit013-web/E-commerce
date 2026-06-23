import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import CacheBadge from '../components/CacheBadge';

const CATEGORIES = ['all', 'Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Beauty', 'Automotive'];
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
];

interface Product {
  _id: string; name: string; description: string; price: number;
  category: string; stock: number; imageUrl: string; rating: number;
  numReviews: number; brand: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('createdAt');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<'HIT' | 'MISS' | 'BYPASS' | null>(null);
  const [responseTime, setResponseTime] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20, category, sort };
      if (search) params.q = search;

      const res = await api.get('/products', { params });
      setProducts(res.data.products);
      setTotal(res.data.total);
      setPages(res.data.pages || 1);
      setCacheStatus(res.headers['x-cache'] as 'HIT' | 'MISS' | 'BYPASS');
      setResponseTime(res.headers['x-response-time'] || null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, category, sort, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCategoryChange = (cat: string) => { setCategory(cat); setPage(1); };

  return (
    <div className="fade-in" style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>
            Products
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {total.toLocaleString()} products
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {cacheStatus && <CacheBadge status={cacheStatus} responseTime={responseTime || undefined} />}
          <button
            onClick={fetchProducts}
            className="btn btn-ghost"
            title="Force refresh (clears local state)"
            style={{ padding: '0.4rem 0.75rem' }}
          >
            <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
          <input
            id="product-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input"
            placeholder="Search products…"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
          Search
        </button>
        {search && (
          <button type="button" className="btn btn-ghost" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
            Clear
          </button>
        )}
      </form>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Categories */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
          <Filter size={16} style={{ color: 'var(--color-text-secondary)', alignSelf: 'center' }} />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: `1px solid ${category === cat ? 'rgba(14,165,233,0.5)' : 'var(--color-border)'}`,
                background: category === cat ? 'rgba(14,165,233,0.15)' : 'transparent',
                color: category === cat ? '#38bdf8' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.75rem',
            padding: '0.5rem 0.875rem',
            color: 'var(--color-text-primary)',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{ borderRadius: '1rem', overflow: 'hidden' }}>
              <div className="skeleton" style={{ paddingTop: '75%' }} />
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="skeleton" style={{ height: '14px', width: '60%' }} />
                <div className="skeleton" style={{ height: '14px' }} />
                <div className="skeleton" style={{ height: '14px', width: '80%' }} />
                <div className="skeleton" style={{ height: '36px', marginTop: '0.5rem' }} />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--color-text-secondary)' }}>
          <Search size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>No products found</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Try a different search or category</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '3rem' }}>
          <button
            className="btn btn-ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '0.5rem 1rem' }}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Page {page} of {pages}
          </span>
          <button
            className="btn btn-ghost"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            style={{ padding: '0.5rem 1rem' }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
