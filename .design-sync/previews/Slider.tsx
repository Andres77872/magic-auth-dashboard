import { Slider } from 'magic-auth-dashboard';

const stack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 22, width: 320 };

// The default track — session timeout, in minutes.
export const Default = () => (
  <div style={{ width: 320 }}>
    <Slider defaultValue={[30]} min={5} max={120} step={5} />
  </div>
);

// Labeled with a live value readout — the canonical settings use.
export const WithLabel = () => (
  <div style={stack}>
    <Slider label="Session timeout (minutes)" value={30} showValue min={5} max={120} step={5} />
    <Slider label="Max concurrent sessions" value={5} showValue min={1} max={10} step={1} />
  </div>
);

// The size scale — sm / md / lg track and thumb.
export const Sizes = () => (
  <div style={stack}>
    <Slider size="sm" defaultValue={[25]} />
    <Slider size="md" defaultValue={[50]} />
    <Slider size="lg" defaultValue={[75]} />
  </div>
);

// Disabled — a threshold locked by org policy.
export const Disabled = () => (
  <div style={stack}>
    <Slider label="Password minimum length (org policy)" value={12} showValue min={8} max={32} step={1} disabled />
  </div>
);
