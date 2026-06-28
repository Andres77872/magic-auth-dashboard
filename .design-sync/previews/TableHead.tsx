import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from 'magic-auth-dashboard';

const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 12 };

// TableHead renders blank standalone, so it's shown in context: the uppercased,
// tracked column headers of a members table. The header row is the focus here.
export const ColumnHeaders = () => (
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
      <TableRow>
        <TableCell>Dana Whitfield</TableCell>
        <TableCell>Administrator</TableCell>
        <TableCell>Active</TableCell>
        <TableCell style={{ ...mono, textAlign: 'right' }}>2h ago</TableCell>
        <TableCell style={mono}>usr_8Kd2p</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Marcus Lee</TableCell>
        <TableCell>Member</TableCell>
        <TableCell>Active</TableCell>
        <TableCell style={{ ...mono, textAlign: 'right' }}>Mar 4</TableCell>
        <TableCell style={mono}>usr_3Tq9w</TableCell>
      </TableRow>
    </TableBody>
  </Table>
);
