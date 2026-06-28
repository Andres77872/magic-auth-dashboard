import { Label, Input, Checkbox, Switch } from 'magic-auth-dashboard';

const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, width: 300 };
const inline: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };

// Label paired with its input — the canonical text-field group.
export const FieldGroup = () => (
  <div style={field}>
    <Label htmlFor="member-email">Email address</Label>
    <Input id="member-email" type="email" placeholder="dana.whitfield@acme.com" />
  </div>
);

// Required field — the asterisk is part of the label content.
export const Required = () => (
  <div style={field}>
    <Label htmlFor="role-name">
      Role name <span style={{ color: 'var(--color-destructive)' }}>*</span>
    </Label>
    <Input id="role-name" placeholder="e.g. Billing administrator" />
  </div>
);

// Label paired with a checkbox control (label sits to the right).
export const WithCheckbox = () => (
  <div style={inline}>
    <Checkbox id="mfa-toggle" defaultChecked />
    <Label htmlFor="mfa-toggle">Require multi-factor authentication</Label>
  </div>
);

// Label paired with a switch control.
export const WithSwitch = () => (
  <div style={inline}>
    <Switch id="sso-toggle" defaultChecked />
    <Label htmlFor="sso-toggle">Enable single sign-on</Label>
  </div>
);
