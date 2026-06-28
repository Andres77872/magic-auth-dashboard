import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from 'magic-auth-dashboard';

const meta: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0' };
const muted: React.CSSProperties = { color: 'var(--color-muted-foreground)' };
const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 12 };

// CardContent is the body region below the header. Shown with a header above it
// so its role — the detail rows — reads in context.
export const Content = () => (
  <Card style={{ width: 340 }}>
    <CardHeader>
      <CardTitle>Dana Whitfield</CardTitle>
      <CardDescription>dana.whitfield@acme.com</CardDescription>
    </CardHeader>
    <CardContent>
      <div style={meta}><span style={muted}>Role</span><span>Administrator</span></div>
      <div style={meta}><span style={muted}>Last sign-in</span><span>2h ago</span></div>
      <div style={meta}><span style={muted}>User ID</span><span style={mono}>usr_8Kd2p</span></div>
    </CardContent>
  </Card>
);
