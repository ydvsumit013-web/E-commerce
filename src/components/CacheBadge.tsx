import { Zap } from 'lucide-react';

interface CacheBadgeProps {
  status: 'HIT' | 'MISS' | 'BYPASS' | null;
  responseTime?: string;
}

export default function CacheBadge({ status, responseTime }: CacheBadgeProps) {
  if (!status) return null;

  const config = {
    HIT: { label: 'CACHE HIT', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
    MISS: { label: 'CACHE MISS', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
    BYPASS: { label: 'BYPASSED', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)' },
  }[status];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '999px',
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
      }}
    >
      <Zap size={10} />
      {config.label}
      {responseTime && (
        <span style={{ opacity: 0.7, fontWeight: 400 }}>· {responseTime}</span>
      )}
    </div>
  );
}
