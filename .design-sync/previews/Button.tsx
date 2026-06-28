import { Button } from 'magic-auth-dashboard';

// Small inline icons (Meridian uses Lucide; inline keeps the preview self-contained).
const row: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' };
const UserPlus = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" />
  </svg>
);
const ArrowRight = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const Trash = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// The variant axis — Meridian's full button language. Buttons are verbs, sentence case.
export const Variants = () => (
  <div style={row}>
    <Button variant="primary">Invite member</Button>
    <Button variant="secondary">Cancel</Button>
    <Button variant="destructive">Suspend user</Button>
    <Button variant="outline">Filters</Button>
    <Button variant="ghost">Dismiss</Button>
    <Button variant="link">View audit log</Button>
  </div>
);

export const Sizes = () => (
  <div style={row}>
    <Button size="xs">Extra small</Button>
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
    <Button size="xl">Extra large</Button>
  </div>
);

export const WithIcons = () => (
  <div style={row}>
    <Button leftIcon={UserPlus}>Invite member</Button>
    <Button variant="secondary" rightIcon={ArrowRight}>Next step</Button>
    <Button variant="destructive" leftIcon={Trash}>Revoke access</Button>
    <Button size="icon" variant="ghost" aria-label="Add">{UserPlus}</Button>
  </div>
);

export const States = () => (
  <div style={row}>
    <Button loading>Saving changes</Button>
    <Button disabled>Unavailable</Button>
    <Button variant="secondary" disabled>Read only</Button>
  </div>
);
