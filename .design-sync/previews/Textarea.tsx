import { Textarea } from 'magic-auth-dashboard';

const stack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 14, width: 380 };

// The default multi-line field — an audit-log note.
export const Default = () => (
  <div style={stack}>
    <Textarea placeholder="Add a note for the audit log…" rows={3} />
  </div>
);

// Labeled, required, with helper text — the canonical form-group composition.
export const WithLabel = () => (
  <div style={stack}>
    <Textarea
      label="Suspension reason"
      required
      rows={3}
      helperText="Visible to other administrators in the audit log."
      defaultValue="Repeated failed sign-in attempts from an unrecognized IP."
    />
  </div>
);

// Error state — error text replaces the helper text.
export const ErrorState = () => (
  <div style={stack}>
    <Textarea
      label="Suspension reason"
      required
      rows={3}
      error="A reason is required before suspending a member."
    />
  </div>
);

// Disabled — a read-only locked note.
export const Disabled = () => (
  <div style={stack}>
    <Textarea
      label="Onboarding note"
      rows={3}
      disabled
      defaultValue="Provisioned via SSO on 2026-05-02. Role assigned by Dana Whitfield."
    />
  </div>
);
