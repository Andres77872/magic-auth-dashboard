import {
  Tabs, TabsList, TabsTrigger, TabsContent,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Badge,
} from 'magic-auth-dashboard';

const muted: React.CSSProperties = { color: 'var(--color-muted-foreground)' };
const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 12 };

// A realistic tabbed admin panel: Members / Roles / Audit log. The Members tab
// opens by default (defaultValue) showing a compact members table.
export const Panel = () => (
  <Tabs defaultValue="members" style={{ width: 460 }}>
    <TabsList>
      <TabsTrigger value="members">Members</TabsTrigger>
      <TabsTrigger value="roles">Roles</TabsTrigger>
      <TabsTrigger value="audit">Audit log</TabsTrigger>
    </TabsList>
    <TabsContent value="members">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Dana Whitfield</TableCell>
            <TableCell>Administrator</TableCell>
            <TableCell><Badge variant="success" dot>Active</Badge></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Priya Shah</TableCell>
            <TableCell>Viewer</TableCell>
            <TableCell><Badge variant="info" dot>Invited</Badge></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TabsContent>
    <TabsContent value="roles">
      <div style={{ ...muted, fontSize: 13, padding: '12px 2px' }}>3 roles · Administrator, Member, Viewer</div>
    </TabsContent>
    <TabsContent value="audit">
      <div style={{ ...muted, fontSize: 13, padding: '12px 2px' }}>No recent events</div>
    </TabsContent>
  </Tabs>
);

// A simpler two-tab switch — settings sub-navigation.
export const Settings = () => (
  <Tabs defaultValue="general" style={{ width: 360 }}>
    <TabsList>
      <TabsTrigger value="general">General</TabsTrigger>
      <TabsTrigger value="security">Security</TabsTrigger>
    </TabsList>
    <TabsContent value="general">
      <div style={{ fontSize: 13, padding: '12px 2px' }}>
        Workspace name <span style={mono}>acme</span>
      </div>
    </TabsContent>
    <TabsContent value="security">
      <div style={{ fontSize: 13, padding: '12px 2px' }}>SSO enforced · MFA required</div>
    </TabsContent>
  </Tabs>
);
