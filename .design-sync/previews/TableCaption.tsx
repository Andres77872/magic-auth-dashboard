import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption,
  Badge,
} from 'magic-auth-dashboard';

const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 12 };

// TableCaption is the muted caption line beneath a table — shown in context as
// the summary/footnote for a members list.
export const Caption = () => (
  <Table>
    <TableCaption>Members of the Acme workspace · updated 2h ago</TableCaption>
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
        <TableCell>Dana Whitfield</TableCell>
        <TableCell>Administrator</TableCell>
        <TableCell><Badge variant="success" dot>Active</Badge></TableCell>
        <TableCell style={mono}>usr_8Kd2p</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Marcus Lee</TableCell>
        <TableCell>Member</TableCell>
        <TableCell><Badge variant="success" dot>Active</Badge></TableCell>
        <TableCell style={mono}>usr_3Tq9w</TableCell>
      </TableRow>
    </TableBody>
  </Table>
);
