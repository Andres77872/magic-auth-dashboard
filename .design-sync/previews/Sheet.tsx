import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
  Button, Badge, Separator,
} from 'magic-auth-dashboard';

const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0' };
const muted: React.CSSProperties = { color: 'var(--color-muted-foreground)' };
const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 12 };

// A right-hand detail panel — the common "inspect this member" drawer.
export const MemberDetail = () => (
  <Sheet open>
    <SheetContent side="right">
      <SheetHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SheetTitle>Dana Whitfield</SheetTitle>
          <Badge variant="success" dot>Active</Badge>
        </div>
        <SheetDescription>dana.whitfield@acme.com</SheetDescription>
      </SheetHeader>
      <div style={{ padding: '16px 0' }}>
        <div style={row}><span style={muted}>Role</span><span>Administrator</span></div>
        <Separator />
        <div style={row}><span style={muted}>Last sign-in</span><span>2h ago · 10.4.1.22</span></div>
        <Separator />
        <div style={row}><span style={muted}>User ID</span><span style={mono}>usr_8Kd2p</span></div>
        <Separator />
        <div style={row}><span style={muted}>Sessions</span><span>3 active</span></div>
      </div>
      <SheetFooter>
        <Button variant="secondary">Edit role</Button>
        <Button variant="destructive">Revoke access</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
);
