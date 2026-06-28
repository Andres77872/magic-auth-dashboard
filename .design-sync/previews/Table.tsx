import {
  Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption,
  Badge,
} from 'magic-auth-dashboard';

const muted: React.CSSProperties = { color: 'var(--color-muted-foreground)' };
const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 12 };
const member: React.CSSProperties = { display: 'flex', flexDirection: 'column', lineHeight: 1.3 };
const name: React.CSSProperties = { fontWeight: 600 };
const email: React.CSSProperties = { ...muted, fontSize: 12 };
// Right-align + tabular figures for the timestamp column.
const num: React.CSSProperties = { ...mono, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

const members = [
  { name: 'Dana Whitfield', email: 'dana.whitfield@acme.com', role: 'Administrator', status: 'Active', signin: '2h ago', id: 'usr_8Kd2p' },
  { name: 'Marcus Lee', email: 'marcus.lee@acme.com', role: 'Member', status: 'Active', signin: 'Mar 4', id: 'usr_3Tq9w' },
  { name: 'Priya Shah', email: 'priya.shah@acme.com', role: 'Viewer', status: 'Invited', signin: '—', id: 'usr_1Lf6m' },
  { name: 'Owen Castillo', email: 'owen.castillo@acme.com', role: 'Member', status: 'Suspended', signin: 'Feb 18', id: 'usr_5Rb2x' },
] as const;

const statusBadge = (s: string) =>
  s === 'Active' ? <Badge variant="success" dot>Active</Badge>
  : s === 'Invited' ? <Badge variant="info" dot>Invited</Badge>
  : <Badge variant="destructive" dot>Suspended</Badge>;

// The hero: a realistic admin members table. Member (name + email), Role,
// Status badge, Last sign-in and a mono User ID. Borders, not shadows; 13px dense.
export const MembersTable = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Member</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Status</TableHead>
        <TableHead style={{ textAlign: 'right' }}>Last sign-in</TableHead>
        <TableHead>User ID</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {members.map((m) => (
        <TableRow key={m.id}>
          <TableCell>
            <span style={member}>
              <span style={name}>{m.name}</span>
              <span style={email}>{m.email}</span>
            </span>
          </TableCell>
          <TableCell>{m.role}</TableCell>
          <TableCell>{statusBadge(m.status)}</TableCell>
          <TableCell style={num}>{m.signin}</TableCell>
          <TableCell style={mono}>{m.id}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

// Same table with a caption and a summary footer row — the full compound.
export const WithCaption = () => (
  <Table>
    <TableCaption>Members of the Acme workspace · updated 2h ago</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead>Member</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Status</TableHead>
        <TableHead style={{ textAlign: 'right' }}>Last sign-in</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {members.slice(0, 3).map((m) => (
        <TableRow key={m.id}>
          <TableCell style={name}>{m.name}</TableCell>
          <TableCell>{m.role}</TableCell>
          <TableCell>{statusBadge(m.status)}</TableCell>
          <TableCell style={num}>{m.signin}</TableCell>
        </TableRow>
      ))}
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableCell colSpan={3}>Total members</TableCell>
        <TableCell style={num}>1,284</TableCell>
      </TableRow>
    </TableFooter>
  </Table>
);
