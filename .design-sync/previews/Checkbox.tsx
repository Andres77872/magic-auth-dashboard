import { Checkbox } from 'magic-auth-dashboard';

const stack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 };

// Checked / unchecked / indeterminate — the three Radix states.
export const States = () => (
  <div style={stack}>
    <Checkbox label="Require multi-factor authentication" defaultChecked />
    <Checkbox label="Allow API token creation" />
    <Checkbox label="Manage members" checked="indeterminate" />
  </div>
);

// A permission group — the canonical use in the role editor.
export const PermissionGroup = () => (
  <div style={stack}>
    <Checkbox label="View members" defaultChecked />
    <Checkbox label="Invite members" defaultChecked />
    <Checkbox label="Suspend members" />
    <Checkbox label="Delete members" />
  </div>
);

// Disabled — a permission locked by a parent role.
export const Disabled = () => (
  <div style={stack}>
    <Checkbox label="View audit log (inherited from Administrator)" defaultChecked disabled />
    <Checkbox label="Export audit log" disabled />
  </div>
);

// Error — a consent box that must be checked.
export const ErrorState = () => (
  <div style={stack}>
    <Checkbox label="I understand this permanently deletes the member" error="Required to continue." />
  </div>
);
