import {
  Card, CardHeader, CardTitle, CardDescription, Badge,
} from 'magic-auth-dashboard';

// CardHeader holds the title + description block at the top of a card. Shown in
// a real Card so its role — the labeled lead-in — reads clearly.
export const Header = () => (
  <Card style={{ width: 340 }}>
    <CardHeader>
      <CardTitle>Engineering</CardTitle>
      <CardDescription>42 members · 5 roles · created Mar 2024</CardDescription>
    </CardHeader>
  </Card>
);

// Header with a trailing status — the common members/groups detail pattern.
export const HeaderWithBadge = () => (
  <Card style={{ width: 340 }}>
    <CardHeader>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CardTitle>Dana Whitfield</CardTitle>
        <Badge variant="success" dot>Active</Badge>
      </div>
      <CardDescription>dana.whitfield@acme.com</CardDescription>
    </CardHeader>
  </Card>
);
