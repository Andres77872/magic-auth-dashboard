import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel,
} from 'magic-auth-dashboard';

// Closed triggers showing a chosen value — reliable, the resting state.
export const Triggers = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
    <Select defaultValue="admin">
      <SelectTrigger style={{ width: 200 }}><SelectValue placeholder="Select role" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Administrator</SelectItem>
        <SelectItem value="member">Member</SelectItem>
        <SelectItem value="viewer">Viewer</SelectItem>
      </SelectContent>
    </Select>
    <Select>
      <SelectTrigger style={{ width: 200 }}><SelectValue placeholder="Select role" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Administrator</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

// Open listbox — the role picker mid-selection.
export const Open = () => (
  <Select defaultOpen defaultValue="member">
    <SelectTrigger style={{ width: 220 }}><SelectValue placeholder="Select role" /></SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Access control</SelectLabel>
        <SelectItem value="admin">Administrator</SelectItem>
        <SelectItem value="member">Member</SelectItem>
        <SelectItem value="viewer">Viewer</SelectItem>
        <SelectItem value="billing">Billing manager</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
);
