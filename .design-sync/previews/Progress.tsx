import { Progress } from 'magic-auth-dashboard';

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16, width: 280 };
const muted: React.CSSProperties = { color: 'var(--color-muted-foreground)', fontSize: 12 };

// Labeled track with percentage readout — the canonical "storage used" meter.
export const Labeled = () => (
  <div style={col}>
    <Progress value={68} label="Storage used" showLabel />
  </div>
);

// A few values to show fill behavior across the range.
export const Values = () => (
  <div style={col}>
    <Progress value={30} />
    <Progress value={70} />
    <Progress value={100} variant="success" />
  </div>
);

// Semantic variants double as quiet status meters (quota, seats, errors).
export const Variants = () => (
  <div style={col}>
    <Progress value={45} variant="primary" label="Seats used" showLabel />
    <Progress value={82} variant="warning" label="API quota" showLabel />
    <Progress value={96} variant="destructive" label="Rate limit" showLabel />
  </div>
);

// Size scale and the indeterminate state for in-flight syncs.
export const SizesAndIndeterminate = () => (
  <div style={col}>
    <Progress value={50} size="sm" />
    <Progress value={50} size="md" />
    <Progress value={50} size="lg" />
    <div>
      <div style={{ ...muted, marginBottom: 6 }}>Syncing directory…</div>
      <Progress indeterminate />
    </div>
  </div>
);
