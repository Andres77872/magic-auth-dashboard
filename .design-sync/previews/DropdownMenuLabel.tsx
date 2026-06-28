import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
  Button,
} from 'magic-auth-dashboard';

// DropdownMenuLabel is a non-interactive section heading inside a menu — shown
// here in its natural place (an open menu) labelling a group of actions.
export const InMenu = () => (
  <DropdownMenu defaultOpen>
    <DropdownMenuTrigger asChild>
      <Button variant="secondary" size="sm">Manage</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" style={{ width: 220 }}>
      <DropdownMenuLabel>Access control</DropdownMenuLabel>
      <DropdownMenuItem>Edit role</DropdownMenuItem>
      <DropdownMenuItem>Manage permissions</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Session</DropdownMenuLabel>
      <DropdownMenuItem>Sign out everywhere</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
