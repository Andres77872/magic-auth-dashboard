import { Spinner } from 'magic-auth-dashboard';

const row: React.CSSProperties = { display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' };
const muted: React.CSSProperties = { color: 'var(--color-muted-foreground)', fontSize: 12 };

// Size scale — xs for inline, md/lg for panels, xl for full-page loads.
export const Sizes = () => (
  <div style={row}>
    <Spinner size="xs" />
    <Spinner size="sm" />
    <Spinner size="md" />
    <Spinner size="lg" />
    <Spinner size="xl" />
  </div>
);

// Default (muted) vs primary (azure accent) — accent used sparingly.
export const Variants = () => (
  <div style={row}>
    <div style={{ textAlign: 'center' }}>
      <Spinner variant="default" />
      <div style={muted}>default</div>
    </div>
    <div style={{ textAlign: 'center' }}>
      <Spinner variant="primary" />
      <div style={muted}>primary</div>
    </div>
  </div>
);

// Spinner with a status message — the canonical inline loading state.
export const WithMessage = () => (
  <div style={row}>
    <Spinner size="lg" variant="primary" message="Loading members…" />
  </div>
);
