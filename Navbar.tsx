import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap, LogOut, LayoutDashboard, Package, User } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { itemCount } = useCartStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav
      style={{
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(51,65,85,0.5)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={18} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }} className="gradient-text">
            InfoTact
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Link to="/products" className="btn btn-ghost" style={{ padding: '0.4rem 0.9rem' }}>
            <Package size={16} />
            Products
          </Link>

          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn btn-ghost" style={{ padding: '0.4rem 0.9rem' }}>
                  <LayoutDashboard size={16} />
                  Admin
                </Link>
              )}
              <Link to="/cart" className="btn btn-ghost" style={{ padding: '0.4rem 0.9rem', position: 'relative' }}>
                <ShoppingCart size={16} />
                Cart
                {itemCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    {itemCount}
                  </span>
                )}
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  <User size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  {user.name}
                </span>
                <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem' }}>
                  <LogOut size={14} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost" style={{ padding: '0.4rem 0.9rem' }}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.4rem 0.9rem' }}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
