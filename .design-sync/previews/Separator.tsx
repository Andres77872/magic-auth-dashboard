import { Separator } from 'magic-auth-dashboard';

const muted: React.CSSProperties = { color: 'var(--color-muted-foreground)', fontSize: 12 };
const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 12 };

// Horizontal rule between stacked sections — the default orientation.
export const Horizontal = () => (
  <div style={{ width: 300 }}>
    <div style={{ fontWeight: 600, fontSize: 14 }}>Dana Whitfield</div>
    <div style={{ ...muted, marginBottom: 12 }}>dana.whitfield@acme.com</div>
    <Separator />
    <div style={{ ...muted, marginTop: 12 }}>Last sign-in · 2h ago</div>
  </div>
);

// Vertical rule separating inline metadata — a thin 1px divider, borders not shadows.
export const Vertical = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 20 }}>
    <span style={{ fontSize: 13 }}>Administrator</span>
    <Separator orientation="vertical" />
    <span style={mono}>usr_8Kd2p</span>
    <Separator orientation="vertical" />
    <span style={muted}>3 sessions</span>
  </div>
);
