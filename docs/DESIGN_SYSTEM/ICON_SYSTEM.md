# 🎨 Icon System - Magic Auth Dashboard

**Version:** 3.0  
**Last Updated:** 2025-10-12  
**Status:** ✅ Refactored - SVG Files + TSX Wrappers

> A comprehensive library of 40 optimized SVG icons with accessibility-first design, consistent sizing, and modern implementation patterns. Icons are now stored as separate SVG files in `/public/icons/` and loaded via lightweight TSX wrapper components.

---

## 🚀 Quick Start

```tsx
// Import icons
import { UserIcon, EditIcon, CheckIcon } from '@/components/icons';

// Basic usage
<UserIcon size={20} />

// With accessibility
<button aria-label="Edit profile">
  <EditIcon size={16} aria-hidden="true" />
</button>

// With custom styling
<CheckIcon 
  size={24} 
  className="text-success" 
  strokeWidth={2.5}
/>
```

---

## Available Icons

### Navigation Icons (7)
- **ArrowDown** - Dropdown indicators, sorting
- **ArrowLeft** - Back navigation, previous
- **ArrowRight** - Forward navigation, next
- **ArrowUp** - Upload, sorting
- **Chevron** - Expandable sections, dropdowns
- **Home** - Home navigation
- **Dashboard** - Dashboard navigation

### Action Icons (10)
- **Check** - Confirmations, completed states
- **Close** - Close modals, dismiss notifications
- **Delete** - Delete actions
- **Edit** - Edit actions
- **Export** - Export data
- **Plus** - Add new items
- **Refresh** - Reload, refresh data
- **Search** - Search functionality
- **View** - View details
- **More** - Additional options menu

### UI Icons (10)
- **Circle** - Status indicators, bullets
- **Clock** - Time, timestamps, activity
- **Document** - Files, documentation
- **Eye** - Visibility toggle, view
- **HorizontalLine** - Dividers, separators
- **Info** - Information tooltips
- **Loading** - Loading states
- **Menu** - Mobile menu, navigation drawer
- **Notification** - Notifications, alerts
- **Settings** - Settings, configuration

### System Icons (8)
- **Error** - Error states, validation
- **Health** - Health metrics, status
- **Lock** - Locked states, security
- **Logo** - Application branding
- **Logout** - Logout action
- **Security** - Security features
- **Warning** - Warning messages
- **Smiley** - Positive feedback, empty states

### Entity Icons (5)
- **Group** - User groups, teams
- **Project** - Projects, workspaces
- **User** - User accounts, profiles
- **UserBadge** - Role management, user roles, access levels

---

## Standard Sizes

| Size | Pixels | Use Case | Example |
|------|--------|----------|---------|
| **XS** | 12px | Inline text indicators | Badge icons |
| **SM** | 16px | Buttons, compact UI | Action buttons |
| **MD** | 20px | Default size, navigation | Nav items |
| **LG** | 24px | Headers, prominent actions | Page headers |
| **XL** | 32px | Hero sections, large displays | Dashboard cards |

---

## Usage

### Basic Import

```tsx
import { EditIcon, DeleteIcon, CheckIcon } from '@/components/icons';
```

### In Components

```tsx
// Button with icon
<button className="btn btn-primary">
  <EditIcon size={16} />
  Edit
</button>

// Icon only button
<button className="btn btn-ghost" aria-label="Delete item">
  <DeleteIcon size={20} />
</button>

// Navigation link
<a href="/dashboard" className="nav-link">
  <DashboardIcon size={20} />
  <span>Dashboard</span>
</a>
```

### With Custom Props

All icons accept standard SVG props:

```tsx
<CheckIcon 
  size={24}
  className="custom-class"
  color="var(--color-success)"
  aria-hidden="true"
/>
```

---

## ♿ Accessibility Guidelines

### The Golden Rules

#### 1. **Decorative Icons (with text label)**
```tsx
// ✅ Good - Icon hidden from screen readers
<button className="btn btn-primary">
  <PlusIcon size={16} aria-hidden="true" />
  <span>Add User</span>
</button>

// ❌ Bad - Screen reader announces both icon and text
<button className="btn btn-primary">
  <PlusIcon size={16} />
  <span>Add User</span>
</button>
```

#### 2. **Standalone Icons (no text)**
```tsx
// ✅ Good - Descriptive label for screen readers
<button 
  className="btn btn-ghost" 
  aria-label="Delete project"
>
  <DeleteIcon size={20} />
</button>

// ❌ Bad - No context for screen readers
<button className="btn btn-ghost">
  <DeleteIcon size={20} />
</button>
```

#### 3. **Status/Informative Icons**
```tsx
// ✅ Good - Icon provides information
<div className="alert">
  <WarningIcon 
    size={20} 
    role="img" 
    aria-label="Warning"
  />
  <span>This action cannot be undone</span>
</div>

// Alternative with text
<div className="alert">
  <WarningIcon size={20} aria-hidden="true" />
  <span>Warning: This action cannot be undone</span>
</div>
```

#### 4. **Loading States**
```tsx
// ✅ Good - Announces loading state
<button disabled aria-live="polite" aria-busy="true">
  <LoadingIcon className="spinning" aria-hidden="true" />
  <span>Loading...</span>
</button>
```

### Accessibility Checklist

- [ ] **Icon with text?** → Add `aria-hidden="true"` to icon
- [ ] **Icon alone?** → Add `aria-label` to parent element
- [ ] **Informative icon?** → Add `role="img"` and `aria-label` to icon
- [ ] **Color contrast** → Ensure 3:1 minimum for UI elements
- [ ] **Focus visible** → Test keyboard navigation
- [ ] **Touch targets** → Minimum 44x44px for interactive elements

### WCAG 2.1 Compliance

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 1.1.1 Non-text Content | A | ✅ Pass | aria-label, aria-hidden |
| 1.4.3 Contrast (Minimum) | AA | ✅ Pass | 3:1 for UI components |
| 1.4.11 Non-text Contrast | AA | ✅ Pass | Icons meet contrast |
| 2.4.7 Focus Visible | AA | ✅ Pass | Focus rings on all interactive |
| 2.5.5 Target Size | AAA | ✅ Pass | 44x44px minimum |

---

## Color and Theming

### Default Behavior

Icons inherit the color from their parent element:

```tsx
<div className="text-error">
  <ErrorIcon size={20} /> {/* Will be red */}
</div>
```

### Custom Colors

```tsx
// Using CSS custom properties
<SuccessIcon color="var(--color-success)" />

// Using direct color values (not recommended)
<WarningIcon color="#f59e0b" />
```

### Dark Mode

Icons automatically adapt to dark mode through CSS custom properties. No additional configuration needed.

---

## 💡 Real-World Examples

### Action Buttons with Icons

```tsx
// Primary action with icon
<button className="btn btn-primary">
  <PlusIcon size={16} aria-hidden="true" />
  <span>Add New Project</span>
</button>

// Button group with icons
<div className="flex gap-2">
  <button className="btn btn-outline">
    <ExportIcon size={16} aria-hidden="true" />
    <span>Export</span>
  </button>
  <button className="btn btn-outline">
    <RefreshIcon size={16} aria-hidden="true" />
    <span>Refresh</span>
  </button>
</div>

// Icon-only actions (must have aria-label)
<div className="flex items-center gap-1">
  <button className="btn btn-ghost btn-sm" aria-label="Edit item">
    <EditIcon size={16} />
  </button>
  <button className="btn btn-ghost btn-sm" aria-label="Delete item">
    <DeleteIcon size={16} />
  </button>
  <button className="btn btn-ghost btn-sm" aria-label="More options">
    <MoreIcon size={16} />
  </button>
</div>
```

### Status Indicators

```tsx
// Status badges with icons
<div className="flex flex-wrap gap-2">
  <span className="badge badge-success">
    <CheckIcon size={14} aria-hidden="true" />
    <span>Completed</span>
  </span>
  <span className="badge badge-warning">
    <ClockIcon size={14} aria-hidden="true" />
    <span>In Progress</span>
  </span>
  <span className="badge badge-error">
    <ErrorIcon size={14} aria-hidden="true" />
    <span>Failed</span>
  </span>
</div>

// Alert messages
<div className="alert alert-info">
  <InfoIcon size={20} role="img" aria-label="Information" />
  <div>
    <strong>New Feature Available</strong>
    <p className="text-sm">Check out our latest updates.</p>
  </div>
</div>
```

### List Items with Icons

```tsx
// Navigation menu
<nav className="flex flex-col gap-1">
  <a href="/dashboard" className="nav-link">
    <DashboardIcon size={20} aria-hidden="true" />
    <span>Dashboard</span>
  </a>
  <a href="/projects" className="nav-link">
    <ProjectIcon size={20} aria-hidden="true" />
    <span>Projects</span>
  </a>
  <a href="/users" className="nav-link">
    <UserIcon size={20} aria-hidden="true" />
    <span>Users</span>
  </a>
  <a href="/settings" className="nav-link">
    <SettingsIcon size={20} aria-hidden="true" />
    <span>Settings</span>
  </a>
</nav>

// Feature list
<ul className="space-y-3">
  <li className="flex items-start gap-3">
    <CheckIcon size={20} className="text-success mt-0.5" aria-hidden="true" />
    <span>Unlimited projects</span>
  </li>
  <li className="flex items-start gap-3">
    <CheckIcon size={20} className="text-success mt-0.5" aria-hidden="true" />
    <span>Advanced analytics</span>
  </li>
  <li className="flex items-start gap-3">
    <CheckIcon size={20} className="text-success mt-0.5" aria-hidden="true" />
    <span>Priority support</span>
  </li>
</ul>
```

### Form Fields with Icons

```tsx
// Input with icon prefix
<div className="form-field">
  <label htmlFor="search" className="form-label">Search</label>
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
      <SearchIcon size={18} aria-hidden="true" />
    </div>
    <input
      id="search"
      type="text"
      className="form-input pl-10"
      placeholder="Search projects..."
    />
  </div>
</div>

// Input with validation icon
<div className="form-field">
  <label htmlFor="email" className="form-label">Email</label>
  <div className="relative">
    <input
      id="email"
      type="email"
      className={`form-input ${hasError ? 'form-input-error' : ''}`}
      aria-invalid={hasError}
    />
    {hasError && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error">
        <ErrorIcon size={18} aria-hidden="true" />
      </div>
    )}
  </div>
  {hasError && (
    <span className="form-error" role="alert">
      Please enter a valid email address
    </span>
  )}
</div>
```

### Navigation Menu

```tsx
<nav className="navigation-menu">
  <a href="/dashboard" className="nav-link">
    <DashboardIcon size={20} />
    <span>Dashboard</span>
  </a>
  <a href="/projects" className="nav-link">
    <ProjectIcon size={20} />
    <span>Projects</span>
  </a>
  <a href="/users" className="nav-link">
    <UserIcon size={20} />
    <span>Users</span>
  </a>
</nav>
```

### Status Indicators

```tsx
// Success state
<div className="status-item">
  <CheckIcon size={16} className="text-success" />
  <span>Completed</span>
</div>

// Error state
<div className="status-item">
  <ErrorIcon size={16} className="text-error" />
  <span>Failed</span>
</div>

// Warning state
<div className="status-item">
  <WarningIcon size={16} className="text-warning" />
  <span>Pending</span>
</div>
```

### Loading States

```tsx
<button className="btn btn-primary" disabled>
  <LoadingIcon size={16} className="spinning" />
  Loading...
</button>
```

---

## Component Architecture

### Overview

The icon system uses a **separation of concerns** approach:
- **SVG Files** (`/public/icons/*.svg`) - Raw SVG graphics
- **TSX Wrappers** (`/src/components/icons/*Icon.tsx`) - React components that load SVG files
- **Base Icon Component** (`/src/components/icons/Icon.tsx`) - Shared loader component

### Base Icon Component

All icon components use the base `Icon` component to load SVG files from `/public/icons/`:

```tsx
interface IconProps extends React.HTMLAttributes<HTMLElement> {
  name: string;        // SVG filename (without .svg extension)
  size?: number;       // Size in pixels (e.g., 16, 20, 24)
  color?: string;
  className?: string;
  'aria-label'?: string;
}
```

The base component:
- Loads SVG files from `/public/icons/` directory
- Accepts numeric size values (e.g., 16, 20, 24)
- Supports any custom size via number prop
- Inherits color from parent via `currentColor`
- Applies custom styling via className

### Standard Icon Component Structure

Each icon component is a lightweight wrapper:

```tsx
import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface ExampleIconProps extends Omit<IconProps, 'name'> {
  size?: number;       // Size in pixels (default: 20)
  color?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * Example Icon - loads example.svg
 * Used for: Specific use cases
 */
export function ExampleIcon({
  size = 20,
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: ExampleIconProps): React.JSX.Element {
  return (
    <Icon
      name="example"
      size={size}
      color={color}
      className={`example-icon ${className}`}
      aria-label={ariaLabel || 'Example'}
      {...props}
    />
  );
}

export default ExampleIcon;
```

### Benefits of This Architecture

1. **Separation of Concerns** - SVG graphics are separate from component logic
2. **Easy SVG Updates** - Update icons by replacing SVG files, no code changes needed
3. **Consistent Loading** - All icons use the same loader mechanism
4. **Type Safety** - TypeScript ensures proper icon usage
5. **Tree Shaking** - Only used icon components are bundled
6. **Maintainability** - Icon logic is centralized in one place

---

## Performance Considerations

### Tree Shaking

Import only the icons you need:

```tsx
// ✅ Good - tree shaking works
import { EditIcon, DeleteIcon } from '@/components/icons';

// ❌ Avoid - imports all icons
import * as Icons from '@/components/icons';
```

### Code Splitting

For rarely used icons, consider lazy loading:

```tsx
const RareIcon = lazy(() => import('@/components/icons/RareIcon'));
```

---

## Adding New Icons

### Steps to Add a New Icon

1. **Create SVG file** in `/public/icons/`
   - Name: `kebab-case-name.svg`
   - Optimize using SVGO or similar tools
   - Ensure `viewBox="0 0 24 24"` for consistency
   - Use `stroke="currentColor"` for color inheritance
   - Include `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`

2. **Create TSX wrapper** in `/src/components/icons/`
   - Name: `PascalCaseNameIcon.tsx`
   - Follow the standard template below
   - Add JSDoc comment with usage info

3. **Export from index** - Add to `/src/components/icons/index.ts`
   ```tsx
   export { default as NewIcon } from './NewIcon';
   export type { NewIconProps } from './NewIcon';
   ```

4. **Document here** - Add to appropriate category in this file

### SVG File Template

Create `/public/icons/new-icon.svg`:

```xml
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Your SVG paths here -->
  <path d="..." stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### TSX Component Template

Create `/src/components/icons/NewIcon.tsx`:

```tsx
import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface NewIconProps extends Omit<IconProps, 'name'> {
  size?: number;       // Size in pixels (default: 20)
  color?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * New Icon - loads new-icon.svg
 * Used for: [Describe specific use cases]
 */
export function NewIcon({
  size = 20,
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: NewIconProps): React.JSX.Element {
  return (
    <Icon
      name="new-icon"
      size={size}
      color={color}
      className={`new-icon ${className}`}
      aria-label={ariaLabel || 'New Icon'}
      {...props}
    />
  );
}

export default NewIcon;
```

### Best Practices

- **SVG Optimization**: Remove unnecessary metadata, comments, and attributes
- **Consistent viewBox**: Always use `viewBox="0 0 24 24"` for uniform scaling
- **Color Inheritance**: Use `currentColor` to allow color customization
- **Naming Convention**: SVG files use kebab-case, TSX files use PascalCase
- **Documentation**: Include usage examples in JSDoc comments
- **File Location**: SVG files in `/public/icons/`, TSX files in `/src/components/icons/`

---

## Related Documentation

- Design tokens: `/docs/DESIGN_SYSTEM/tokens/`
- Component patterns: `/docs/DESIGN_SYSTEM/COMPONENT_INVENTORY.md`
- Accessibility guide: `/docs/DESIGN_SYSTEM/ACCESSIBILITY.md`

---

**Maintained by:** Design System Team  
**Questions?** Create an issue in the project repository
