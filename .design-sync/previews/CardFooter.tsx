import {
  Card, CardContent, CardFooter, Button,
} from 'magic-auth-dashboard';

const muted: React.CSSProperties = { color: 'var(--color-muted-foreground)', fontSize: 13 };

// CardFooter anchors the action row at the bottom of a card. Shown below real
// content so its role — terminal actions — reads in context.
export const Footer = () => (
  <Card style={{ width: 340 }}>
    <CardContent style={{ paddingTop: 20 }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>Suspend Dana Whitfield?</div>
      <div style={{ ...muted, marginTop: 4 }}>
        Active sessions are revoked. The user can be restored later.
      </div>
    </CardContent>
    <CardFooter style={{ gap: 8, justifyContent: 'flex-end' }}>
      <Button size="sm" variant="secondary">Cancel</Button>
      <Button size="sm" variant="destructive">Suspend user</Button>
    </CardFooter>
  </Card>
);
