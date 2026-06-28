import { Badge } from 'magic-auth-dashboard';

const row: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' };

// Meridian status language: Active / Invited / Suspended / Deactivated — quiet
// tints with a saturated dot. This is the canonical use in the members table.
export const Statuses = () => (
  <div style={row}>
    <Badge variant="success" dot>Active</Badge>
    <Badge variant="info" dot>Invited</Badge>
    <Badge variant="warning" dot>Pending</Badge>
    <Badge variant="destructive" dot>Suspended</Badge>
    <Badge variant="secondary" dot>Deactivated</Badge>
  </div>
);

// The full tint palette. Solid semantic fills aren't part of the language —
// every semantic variant is a quiet tint.
export const Variants = () => (
  <div style={row}>
    <Badge variant="primary">Primary</Badge>
    <Badge variant="secondary">Secondary</Badge>
    <Badge variant="success">Success</Badge>
    <Badge variant="warning">Warning</Badge>
    <Badge variant="destructive">Error</Badge>
    <Badge variant="info">Info</Badge>
    <Badge variant="outline">Outline</Badge>
  </div>
);

export const Sizes = () => (
  <div style={row}>
    <Badge size="sm" variant="info">SSO</Badge>
    <Badge size="md" variant="info">RBAC</Badge>
    <Badge size="lg" variant="info">MFA enabled</Badge>
  </div>
);

// Counts and labels — common in nav items and table headers.
export const Counts = () => (
  <div style={row}>
    <Badge variant="primary">3 roles</Badge>
    <Badge variant="secondary">12 members</Badge>
    <Badge variant="warning">2 pending invites</Badge>
  </div>
);
