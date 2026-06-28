import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut,
  Button,
} from 'magic-auth-dashboard';

// Row actions menu — the "⋯" on a members-table row, rendered open.
export const RowActions = () => (
  <DropdownMenu defaultOpen>
    <DropdownMenuTrigger asChild>
      <Button variant="secondary" size="sm">Actions</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" style={{ width: 220 }}>
      <DropdownMenuLabel>Dana Whitfield</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Edit role<DropdownMenuShortcut>⌘E</DropdownMenuShortcut></DropdownMenuItem>
      <DropdownMenuItem>Reset password</DropdownMenuItem>
      <DropdownMenuItem>View audit log</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Suspend user</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
