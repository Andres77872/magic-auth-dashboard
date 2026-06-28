import { Avatar, Badge } from 'magic-auth-dashboard';

const row: React.CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' };
const muted: React.CSSProperties = { color: 'var(--color-muted-foreground)', fontSize: 12 };
const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 12 };

// Deterministic tinted monograms — the tint is derived from the name, so each
// member reads as a distinct, stable color across the console.
export const Tints = () => (
  <div style={row}>
    <Avatar name="Dana Whitfield" />
    <Avatar name="Marcus Reyes" />
    <Avatar name="Priya Nair" />
    <Avatar name="Tomás Okafor" />
    <Avatar name="Lena Brandt" />
    <Avatar name="Sasha Kim" />
  </div>
);

// Size scale — xs through xl. Compact rows use sm/md; profile headers use xl.
export const Sizes = () => (
  <div style={row}>
    <Avatar size="xs" name="Dana Whitfield" />
    <Avatar size="sm" name="Dana Whitfield" />
    <Avatar size="md" name="Dana Whitfield" />
    <Avatar size="lg" name="Dana Whitfield" />
    <Avatar size="xl" name="Dana Whitfield" />
  </div>
);

// Initials fall back to one letter or '?' when the name is partial or empty.
export const Fallbacks = () => (
  <div style={row}>
    <Avatar name="Acme" />
    <Avatar name="" />
    <Avatar name="root" />
  </div>
);

// Canonical use — a members-table row: avatar + name + email + role badge.
export const MemberRow = () => (
  <div style={{ ...row, gap: 10 }}>
    <Avatar size="lg" name="Marcus Reyes" />
    <div>
      <div style={{ fontWeight: 600, fontSize: 14 }}>Marcus Reyes</div>
      <div style={mono}>marcus.reyes@acme.com</div>
    </div>
    <Badge variant="secondary" style={{ marginLeft: 8 }}>Administrator</Badge>
  </div>
);
