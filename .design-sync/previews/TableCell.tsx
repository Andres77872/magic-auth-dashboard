import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Badge,
} from 'magic-auth-dashboard';

const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 12 };
const muted: React.CSSProperties = { color: 'var(--color-muted-foreground)' };

// TableCell is the body cell — shown in context across a couple of rows. Cells
// hold a name + email stack, a role, a status badge, and mono ID/timestamp.
export const BodyCells = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Member</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>User ID</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell>
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
            <span style={{ fontWeight: 600 }}>Dana Whitfield</span>
            <span style={{ ...muted, fontSize: 12 }}>dana.whitfield@acme.com</span>
          </span>
        </TableCell>
        <TableCell>Administrator</TableCell>
        <TableCell><Badge variant="success" dot>Active</Badge></TableCell>
        <TableCell style={mono}>usr_8Kd2p</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
            <span style={{ fontWeight: 600 }}>Priya Shah</span>
            <span style={{ ...muted, fontSize: 12 }}>priya.shah@acme.com</span>
          </span>
        </TableCell>
        <TableCell>Viewer</TableCell>
        <TableCell><Badge variant="info" dot>Invited</Badge></TableCell>
        <TableCell style={mono}>usr_1Lf6m</TableCell>
      </TableRow>
    </TableBody>
  </Table>
);
