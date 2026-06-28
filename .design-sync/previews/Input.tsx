import { Input } from 'magic-auth-dashboard';

const stack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 14, width: 320 };
const row: React.CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' };

const Search = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);
const Mail = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

// The default field as it appears in the members filter bar.
export const Default = () => (
  <div style={{ width: 320 }}>
    <Input placeholder="Search members…" />
  </div>
);

// A labeled, required field — the canonical form-group composition.
export const WithLabel = () => (
  <div style={stack}>
    <Input label="Email address" type="email" required placeholder="dana.whitfield@acme.com" leftIcon={Mail} />
  </div>
);

// Validation states — error and helper text are first-class props.
export const Validation = () => (
  <div style={stack}>
    <Input label="Email address" type="email" defaultValue="dana@acme" error="Enter a valid email address." />
    <Input label="Display name" defaultValue="Dana Whitfield" validationState="success" helperText="Looks good." />
  </div>
);

// Icons, loading, and character count.
export const Adornments = () => (
  <div style={stack}>
    <Input placeholder="Search members…" leftIcon={Search} />
    <Input placeholder="Resolving directory…" loading defaultValue="acme" />
    <Input label="Invite note" defaultValue="Welcome to the team" maxLength={64} showCharCount />
  </div>
);

// Size scale and disabled.
export const SizesAndStates = () => (
  <div style={row}>
    <div style={{ width: 200 }}><Input size="sm" placeholder="Small" /></div>
    <div style={{ width: 200 }}><Input size="md" placeholder="Medium" /></div>
    <div style={{ width: 200 }}><Input size="lg" placeholder="Large" /></div>
    <div style={{ width: 200 }}><Input disabled defaultValue="usr_8Kd2p" /></div>
  </div>
);
