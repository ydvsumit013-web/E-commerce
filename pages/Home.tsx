import { Link } from 'react-router-dom';
import { Zap, Database, ShoppingCart, Shield, ArrowRight, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="fade-in">
      {/* Hero */}
      <section
        style={{
          minHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '4rem 1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(14,165,233,0.1)',
            border: '1px solid rgba(14,165,233,0.3)',
            borderRadius: '999px',
            padding: '0.35rem 1rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#38bdf8',
            marginBottom: '2rem',
            letterSpacing: '0.05em',
          }}
        >
          <Zap size={12} />
          REDIS CACHE-ASIDE PATTERN DEMO
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-display)',
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            maxWidth: '800px',
          }}
        >
          E-Commerce at{' '}
          <span className="gradient-text">Lightning Speed</span>
        </h1>

        <p
          style={{
            fontSize: '1.125rem',
            color: 'var(--color-text-secondary)',
            maxWidth: '560px',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
          }}
        >
          Built on the Cache-Aside Pattern — watch MongoDB queries drop from{' '}
          <span style={{ color: '#f97316', fontWeight: 600 }}>~240ms</span> to{' '}
          <span style={{ color: '#22c55e', fontWeight: 600 }}>~4ms</span> after caching.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/products" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
            Browse Products
            <ArrowRight size={18} />
          </Link>
          <Link to="/register" className="btn btn-ghost" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
            Get Started
          </Link>
        </div>

        {/* Cache demo pills */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'Cache MISS', time: '~240ms', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
            { label: 'Cache HIT', time: '~4ms', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
            { label: 'Speedup', time: '60×', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '0.75rem',
                background: item.bg,
                border: `1px solid ${item.border}`,
                color: item.color,
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {item.label} · <span style={{ fontWeight: 400 }}>{item.time}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            marginBottom: '3rem',
          }}
        >
          Built for <span className="gradient-text">Performance</span>
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {[
            {
              icon: <Zap size={28} color="#38bdf8" />,
              title: 'Cache-Aside Pattern',
              desc: 'Check Redis first. On miss, hit MongoDB, then cache. Invalidate on writes.',
            },
            {
              icon: <Database size={28} color="#a78bfa" />,
              title: 'MongoDB Aggregation',
              desc: '$lookup, $unwind, $group pipelines compute cart totals server-side.',
            },
            {
              icon: <ShoppingCart size={28} color="#22c55e" />,
              title: 'Smart Cart',
              desc: 'Discount codes, stock validation, real-time totals with aggregation.',
            },
            {
              icon: <Shield size={28} color="#f59e0b" />,
              title: 'JWT Auth + RBAC',
              desc: 'Secure login, bcrypt hashing, admin-only endpoints enforced server-side.',
            },
            {
              icon: <TrendingUp size={28} color="#f97316" />,
              title: 'Cache Stats Dashboard',
              desc: 'Live hit/miss rate, response-time tracking, invalidation visibility.',
            },
            {
              icon: <Database size={28} color="#38bdf8" />,
              title: '600 Seeded Products',
              desc: 'faker.js generated products across 8 categories, ready to demo.',
            },
          ].map((f) => (
            <div key={f.title} className="glass" style={{ padding: '1.75rem' }}>
              <div style={{ marginBottom: '1rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
