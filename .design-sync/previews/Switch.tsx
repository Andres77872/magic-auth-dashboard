import { Switch } from 'magic-auth-dashboard';

const stack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 };
const rowBetween: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 300,
};
const muted: React.CSSProperties = { color: 'var(--color-muted-foreground)', fontSize: 13 };

// On / off — the two states.
export const States = () => (
  <div style={stack}>
    <Switch label="Enable single sign-on" defaultChecked />
    <Switch label="Require email verification" />
  </div>
);

// Account settings toggles — the canonical labeled list.
export const SettingsList = () => (
  <div style={stack}>
    <Switch label="Notify admins on new sign-in" defaultChecked />
    <Switch label="Auto-suspend after 90 days idle" defaultChecked />
    <Switch label="Allow concurrent sessions" />
  </div>
);

// Disabled — a setting enforced by org policy.
export const Disabled = () => (
  <div style={stack}>
    <Switch label="Enforce MFA (managed by org policy)" defaultChecked disabled />
    <Switch label="Allow password sign-in" disabled />
  </div>
);

// A settings row — switch trailing a label and description.
export const SettingRow = () => (
  <div style={rowBetween}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>Maintenance mode</div>
      <div style={muted}>Block all non-admin sign-ins</div>
    </div>
    <Switch aria-label="Maintenance mode" />
  </div>
);
