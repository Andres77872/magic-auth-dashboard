import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge,
} from 'magic-auth-dashboard';

const meta: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0' };
const muted: React.CSSProperties = { color: 'var(--color-muted-foreground)' };
const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 12 };

// A member-detail card — the canonical compound: header (title + description),
// content rows, footer actions. Meridian: borders do the work, not shadows.
export const MemberDetail = () => (
  <Card style={{ width: 360 }}>
    <CardHeader>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CardTitle>Dana Whitfield</CardTitle>
        <Badge variant="success" dot>Active</Badge>
      </div>
      <CardDescription>dana.whitfield@acme.com</CardDescription>
    </CardHeader>
    <CardContent>
      <div style={meta}><span style={muted}>Role</span><span>Administrator</span></div>
      <div style={meta}><span style={muted}>Last sign-in</span><span>2h ago</span></div>
      <div style={meta}><span style={muted}>User ID</span><span style={mono}>usr_8Kd2p</span></div>
    </CardContent>
    <CardFooter style={{ gap: 8 }}>
      <Button size="sm" variant="secondary">Edit role</Button>
      <Button size="sm" variant="destructive">Suspend user</Button>
    </CardFooter>
  </Card>
);

// A metric / stat card — dense, scannable.
export const Metric = () => (
  <Card padding="lg" style={{ width: 240 }}>
    <div style={{ ...muted, fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Active members</div>
    <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.01em', marginTop: 6 }}>1,284</div>
    <div style={{ ...muted, fontSize: 12, marginTop: 4 }}>+24 this week</div>
  </Card>
);

// Interactive card — hover/focusable surface (a clickable list row).
export const Interactive = () => (
  <Card interactive padding="md" style={{ width: 320 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Engineering</div>
        <div style={{ ...muted, fontSize: 12 }}>42 members · 5 roles</div>
      </div>
      <Badge variant="secondary">Group</Badge>
    </div>
  </Card>
);
