import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Label,
} from 'magic-auth-dashboard';

const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };

// Invite flow — the canonical modal: header (title + description), a short form,
// footer actions. Rendered open for the static card.
export const InviteMember = () => (
  <Dialog open>
    <DialogContent size="md">
      <DialogHeader>
        <DialogTitle>Invite member</DialogTitle>
        <DialogDescription>They'll get an email to join this workspace. Members inherit permissions from their role.</DialogDescription>
      </DialogHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0' }}>
        <div style={field}>
          <Label htmlFor="inv-email">Email</Label>
          <Input id="inv-email" placeholder="name@acme.com" defaultValue="priya.shah@acme.com" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="secondary">Cancel</Button>
        <Button>Send invite</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// Destructive confirmation — names the consequence, never "OK".
export const ConfirmSuspend = () => (
  <Dialog open>
    <DialogContent size="sm">
      <DialogHeader>
        <DialogTitle>Suspend Dana Whitfield?</DialogTitle>
        <DialogDescription>They'll be signed out of all sessions immediately and lose access until reinstated.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="secondary">Cancel</Button>
        <Button variant="destructive">Suspend user</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
