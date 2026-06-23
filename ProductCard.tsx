import { ShoppingCart, Star } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useNavigate } from 'react-router-dom';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  rating: number;
  numReviews: number;
  brand: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const navigate = useNavigate();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    await addItem(product._id);
  };

  return (
    <div
      className="glass fade-in"
      style={{
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 48px rgba(14,165,233,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', paddingTop: '75%', overflow: 'hidden' }}>
        <img
          src={product.imageUrl}
          alt={product.name}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s',
          }}
          onMouseEnter={(e) => { (e.target as HTMLImageElement).style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${product._id}/400/400`; }}
        />
        {/* Category badge */}
        <span
          style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
            background: 'rgba(14,165,233,0.2)',
            border: '1px solid rgba(14,165,233,0.4)',
            color: '#38bdf8',
            borderRadius: '999px',
            fontSize: '0.65rem',
            fontWeight: 600,
            padding: '0.2rem 0.6rem',
            backdropFilter: 'blur(8px)',
          }}
        >
          {product.category}
        </span>
        {/* Stock badge */}
        {product.stock === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15,23,42,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#f97316',
            }}
          >
            Out of Stock
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '1rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
          {product.brand}
        </p>
        <h3
          style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            lineHeight: 1.4,
            minHeight: '2.5em',
          }}
        >
          {product.name}
        </h3>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.75rem' }}>
          <Star size={12} fill="#f59e0b" color="#f59e0b" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{product.rating.toFixed(1)}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
            ({product.numReviews.toLocaleString()})
          </span>
        </div>

        {/* Price + cart */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }} className="gradient-text">
            ${product.price.toFixed(2)}
          </span>
          <button
            className="btn btn-primary"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
          >
            <ShoppingCart size={14} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
