import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Tag, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import CacheBadge from '../components/CacheBadge';
import { Link } from 'react-router-dom';

const DISCOUNT_HINTS = ['SAVE10', 'WELCOME20', 'FLASH30'];

export default function Cart() {
  const { user } = useAuthStore();
  const { items, subtotal, discountAmount, total, discountPercent, isLoading, lastCacheStatus,
    fetchCart, removeItem, applyDiscount, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [discountInput, setDiscountInput] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchCart();
  }, [user, navigate, fetchCart]);

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (discountInput.trim()) await applyDiscount(discountInput.trim());
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div className="skeleton" style={{ height: '48px', width: '200px', marginBottom: '2rem' }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: '100px', marginBottom: '1rem', borderRadius: '1rem' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/products" className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              Your Cart
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              {items?.length || 0} item{(items?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {lastCacheStatus && <CacheBadge status={lastCacheStatus} />}
      </div>

      {!items || items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
          <ShoppingBag size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Your cart is empty</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            Browse our products and add something you love.
          </p>
          <Link to="/products" className="btn btn-primary" style={{ justifyContent: 'center' }}>
            Browse Products
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
          {/* Items list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map((item) => (
              <div
                key={item.product}
                className="glass"
                style={{ display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'center' }}
              >
                <img
                  src={item.imageUrl || `https://picsum.photos/seed/${item.product}/80/80`}
                  alt={item.name}
                  style={{ width: '72px', height: '72px', borderRadius: '0.75rem', objectFit: 'cover', flexShrink: 0 }}
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.product}/80/80`; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name || 'Product'}
                  </p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                    Qty: {item.quantity} × ${item.price?.toFixed(2)}
                  </p>
                  {item.stock === 0 && (
                    <span style={{ fontSize: '0.7rem', color: '#f97316', fontWeight: 600 }}>Out of Stock</span>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: 700, marginBottom: '0.5rem' }} className="gradient-text">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeItem(item.product)}
                    className="btn btn-ghost"
                    style={{ padding: '0.3rem', color: '#f97316', border: 'none' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="btn btn-ghost"
              style={{ alignSelf: 'flex-start', color: '#f97316', fontSize: '0.8rem' }}
            >
              <Trash2 size={14} /> Clear Cart
            </button>
          </div>

          {/* Order summary */}
          <div className="glass" style={{ padding: '1.5rem', position: 'sticky', top: '80px' }}>
            <h2 style={{ fontWeight: 700, marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>
              Order Summary
            </h2>

            {/* Discount code */}
            <form onSubmit={handleApplyDiscount} style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
                <Tag size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />
                Discount Code
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  id="discount-code"
                  type="text"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                  className="input"
                  placeholder="SAVE10"
                  style={{ flex: 1, fontSize: '0.8rem' }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 0.875rem', fontSize: '0.8rem' }}>
                  Apply
                </button>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem' }}>
                Hints: {DISCOUNT_HINTS.join(', ')}
              </p>
            </form>

            {/* Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                <span>Subtotal</span>
                <span>${subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              {discountPercent > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22c55e' }}>
                  <span>Discount ({discountPercent}%)</span>
                  <span>-${discountAmount?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex', justifyContent: 'space-between', fontWeight: 800,
                  fontSize: '1.1rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem',
                }}
              >
                <span>Total</span>
                <span className="gradient-text">${total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            <button
              id="checkout-btn"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '0.875rem', fontSize: '0.95rem' }}
              onClick={() => alert('Checkout flow coming soon!')}
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
