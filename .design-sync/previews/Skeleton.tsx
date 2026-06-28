import { Skeleton } from 'magic-auth-dashboard';

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, width: 300 };
const rowCenter: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 };

// Loading placeholder for a member row — avatar + name + email line.
export const MemberRow = () => (
  <div style={{ ...rowCenter, width: 300 }}>
    <Skeleton variant="avatar" />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="40%" />
    </div>
  </div>
);

// A loading members list — repeated rows via the `count` prop.
export const ListPlaceholder = () => (
  <div style={col}>
    <Skeleton variant="title" />
    <Skeleton variant="line" count={3} />
  </div>
);

// The shape vocabulary — each variant maps to a real element it stands in for.
export const Variants = () => (
  <div style={col}>
    <div style={rowCenter}>
      <Skeleton variant="avatar" />
      <Skeleton variant="avatar-lg" />
    </div>
    <Skeleton variant="title" />
    <Skeleton variant="text" />
    <Skeleton variant="button" />
  </div>
);
