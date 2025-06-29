# Magic Auth Dashboard - Design Specification

## Overview

This document outlines the complete design specification for the Magic Auth Dashboard, including user interface layouts, navigation structure, routing system, and feature specifications for ROOT and ADMIN users.

## Application Routes & Navigation

### Route Structure

```
/
├── /login                     # Login page (public)
├── /dashboard                 # Main dashboard (protected)
│   ├── /overview             # Dashboard overview/stats
│   ├── /users                # User management
│   │   ├── /list            # All users list
│   │   ├── /create          # Create new user
│   │   ├── /edit/:id        # Edit user
│   │   └── /profile/:id     # View user profile
│   ├── /projects             # Project management
│   │   ├── /list            # All projects list
│   │   ├── /create          # Create new project
│   │   ├── /edit/:id        # Edit project
│   │   └── /details/:id     # Project details
│   ├── /groups               # User groups management
│   │   ├── /list            # All groups list
│   │   ├── /create          # Create new group
│   │   └── /edit/:id        # Edit group
│   ├── /permissions          # RBAC permissions
│   │   ├── /roles           # Role management
│   │   ├── /permissions     # Permission management
│   │   └── /assignments     # User-role assignments
│   ├── /system               # System management (ROOT only)
│   │   ├── /health          # System health
│   │   ├── /admins          # Admin user management
│   │   └── /settings        # System settings
│   └── /profile              # Current user profile
└── /unauthorized             # Access denied page
```

### Route Guards & Access Control

```typescript
// Route protection based on user type
interface RouteGuard {
  path: string;
  allowedUserTypes: ['root', 'admin'];
  requiredPermissions?: string[];
  component: React.Component;
}

const protectedRoutes: RouteGuard[] = [
  // ROOT only routes
  { path: '/dashboard/system/*', allowedUserTypes: ['root'] },
  { path: '/dashboard/users/create/admin', allowedUserTypes: ['root'] },
  
  // ROOT and ADMIN routes
  { path: '/dashboard/users/*', allowedUserTypes: ['root', 'admin'] },
  { path: '/dashboard/projects/*', allowedUserTypes: ['root', 'admin'] },
  { path: '/dashboard/groups/*', allowedUserTypes: ['root', 'admin'] },
  { path: '/dashboard/permissions/*', allowedUserTypes: ['root', 'admin'] },
];
```

## Page Designs & Layouts

### 1. Login Page (`/login`)

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│                        Header/Logo                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              ┌─────────────────────────┐                    │
│              │     LOGIN FORM          │                    │
│              │                         │                    │
│              │  Username: [________]   │                    │
│              │  Password: [________]   │                    │
│              │                         │                    │
│              │    [Login Button]       │                    │
│              │                         │                    │
│              │  "Admin/Root Only"      │                    │
│              └─────────────────────────┘                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                      Footer                                │
└─────────────────────────────────────────────────────────────┘
```

#### Features
- **Form Fields**: Username, Password
- **Validation**: Client-side validation with real-time feedback
- **Error Handling**: Display login errors (invalid credentials, access denied)
- **Security Notice**: Clear indication that only ROOT/ADMIN users can access
- **Loading State**: Loading spinner during authentication
- **Responsive Design**: Mobile-friendly layout

#### User Flows
1. **Successful Login**: Redirect to `/dashboard/overview`
2. **Failed Authentication**: Show error message, clear password field
3. **CONSUMER User**: Show access denied message with explanation
4. **Remember Session**: Optional "Remember me" checkbox

### 2. Main Dashboard Layout

#### Global Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo | Navigation Menu | User Menu                │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   Sidebar    │            Main Content Area                │
│   Navigation │                                              │
│              │                                              │
│   - Overview │            (Page Content)                   │
│   - Users    │                                              │
│   - Projects │                                              │
│   - Groups   │                                              │
│   - Perms    │                                              │
│   - System   │                                              │
│              │                                              │
├──────────────┼──────────────────────────────────────────────┤
│              │  Footer: Status | Version | Links           │
└──────────────┴──────────────────────────────────────────────┘
```

#### Header Components
- **Logo/Brand**: Application name and logo
- **Navigation Breadcrumbs**: Current page path
- **User Menu**: Profile, logout, settings
- **Notifications**: System alerts and updates
- **Search Bar**: Global search functionality

#### Sidebar Navigation
```typescript
interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  userTypes: ('root' | 'admin')[];
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'overview',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard/overview',
    userTypes: ['root', 'admin']
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'users',
    path: '/dashboard/users',
    userTypes: ['root', 'admin'],
    children: [
      { id: 'users-list', label: 'All Users', path: '/dashboard/users/list' },
      { id: 'users-create', label: 'Create User', path: '/dashboard/users/create' }
    ]
  },
  // ... more items
];
```

### 3. Dashboard Overview (`/dashboard/overview`)

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Welcome Message & Current User Info                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │   Users  │ │ Projects │ │  Groups  │ │ Sessions │      │
│  │   [150]  │ │   [25]   │ │   [12]   │ │   [45]   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐ ┌─────────────────────────────┐   │
│  │   Recent Activity   │ │    System Health Status    │   │
│  │                     │ │                             │   │
│  │ • User created      │ │ Database: ✅ Healthy        │   │
│  │ • Project updated   │ │ Cache: ✅ Active            │   │
│  │ • Permission added  │ │ API: ✅ Responsive          │   │
│  │                     │ │ Sessions: ✅ Normal         │   │
│  └─────────────────────┘ └─────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │               Quick Actions                         │   │
│  │                                                     │   │
│  │  [Create User] [New Project] [Manage Groups]      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### Statistics Cards
- **Total Users**: Count with breakdown by type (ROOT/ADMIN/CONSUMER)
- **Active Projects**: Total projects with active user count
- **User Groups**: Total groups with average members
- **Active Sessions**: Current active sessions

#### Recent Activity Feed
- **User Management**: Recent user creations, updates, deletions
- **Project Changes**: New projects, membership changes
- **Permission Updates**: Role assignments, permission changes
- **System Events**: Login attempts, errors, warnings

#### Quick Actions
- **Create New User**: Direct link to user creation form
- **Create Project**: Direct link to project creation
- **Manage Groups**: Quick access to group management
- **System Settings**: Quick access to system configuration (ROOT only)

### 4. User Management (`/dashboard/users`)

#### User List View (`/dashboard/users/list`)

```
┌─────────────────────────────────────────────────────────────┐
│  Page Header: "User Management"                            │
│  [Search Box] [Filter: Type] [Sort] [+ Create User]       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │          USER TABLE                                 │   │
│  │ ┌──────┬────────────┬─────────────┬──────┬────────┐ │   │
│  │ │Avatar│ Username   │ Email       │ Type │ Actions│ │   │
│  │ ├──────┼────────────┼─────────────┼──────┼────────┤ │   │
│  │ │ [👤] │ root_admin │ admin@...   │ ROOT │ [•••]  │ │   │
│  │ │ [👤] │ proj_admin │ padmin@...  │ADMIN │ [•••]  │ │   │
│  │ │ [👤] │ john_doe   │ john@...    │CONSUM│ [•••]  │ │   │
│  │ └──────┴────────────┴─────────────┴──────┴────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Pagination: [< Prev] [1] [2] [3] [Next >]                │
└─────────────────────────────────────────────────────────────┘
```

#### Features
- **Search & Filter**: Real-time search by username/email, filter by user type
- **Sortable Columns**: Sort by username, email, creation date, user type
- **Pagination**: Server-side pagination with configurable page size
- **Bulk Actions**: Select multiple users for bulk operations
- **Quick Actions**: View, edit, delete, reset password
- **Export**: Export user list to CSV/Excel

#### Action Menus
```typescript
interface UserActions {
  view: () => void;           // View user profile
  edit: () => void;           // Edit user details
  resetPassword: () => void;  // Send password reset
  changeType: () => void;     // Change user type (ROOT only)
  assignProjects: () => void; // Assign to projects
  deactivate: () => void;     // Deactivate account
  delete: () => void;         // Delete user (with confirmation)
}
```

#### Create User Form (`/dashboard/users/create`)

```
┌─────────────────────────────────────────────────────────────┐
│  Page Header: "Create New User"                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 USER FORM                           │   │
│  │                                                     │   │
│  │  Basic Information:                                 │   │
│  │  Username: [________________]                       │   │
│  │  Email:    [________________]                       │   │
│  │  Password: [________________]                       │   │
│  │  Confirm:  [________________]                       │   │
│  │                                                     │   │
│  │  User Type: [Root] [Admin] [Consumer] (ROOT only)  │   │
│  │                                                     │   │
│  │  Project Assignment: (ADMIN type)                  │   │
│  │  ☐ Project Alpha                                   │   │
│  │  ☐ Project Beta                                    │   │
│  │  ☐ Project Gamma                                   │   │
│  │                                                     │   │
│  │  [Cancel]                    [Create User]         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### Form Validation
- **Username**: Unique, alphanumeric, minimum length
- **Email**: Valid email format, unique in system
- **Password**: Strong password requirements with strength meter
- **User Type**: ROOT can create any type, ADMIN can create CONSUMER only
- **Project Assignment**: Required for ADMIN users

### 5. Project Management (`/dashboard/projects`)

#### Project List View (`/dashboard/projects/list`)

```
┌─────────────────────────────────────────────────────────────┐
│  Page Header: "Project Management"                         │
│  [Search Box] [Filter: Status] [Sort] [+ Create Project]  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │         PROJECT CARDS GRID                          │   │
│  │                                                     │   │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │   │
│  │ │Project Alpha│ │Project Beta │ │Project Gamma│    │   │
│  │ │             │ │             │ │             │    │   │
│  │ │45 Users     │ │23 Users     │ │67 Users     │    │   │
│  │ │12 Groups    │ │8 Groups     │ │15 Groups    │    │   │
│  │ │             │ │             │ │             │    │   │
│  │ │[Manage]     │ │[Manage]     │ │[Manage]     │    │   │
│  │ └─────────────┘ └─────────────┘ └─────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  [View All] [Grid View] [List View]                        │
└─────────────────────────────────────────────────────────────┘
```

#### Project Details View (`/dashboard/projects/details/:id`)

```
┌─────────────────────────────────────────────────────────────┐
│  Project: "Project Alpha" [Edit] [Delete]                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐   │
│  │   Users (45)    │ │   Groups (12)   │ │ Permissions │   │
│  │                 │ │                 │ │             │   │
│  │ [View All]      │ │ [Manage]        │ │ [Configure] │   │
│  └─────────────────┘ └─────────────────┘ └─────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Recent Activity                        │   │
│  │                                                     │   │
│  │ • John Doe assigned to Editor role                 │   │
│  │ • New group "Developers" created                   │   │
│  │ • Permission "write_docs" added                    │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Project Statistics                       │   │
│  │                                                     │   │
│  │ Created: Jan 15, 2024                             │   │
│  │ Admin: project_admin                              │   │
│  │ Description: Main development project             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 6. User Groups Management (`/dashboard/groups`)

#### Groups List View (`/dashboard/groups/list`)

```
┌─────────────────────────────────────────────────────────────┐
│  Page Header: "User Groups Management"                     │
│  [Search] [Filter: Project] [+ Create Group]              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │          GROUPS TABLE                               │   │
│  │ ┌────────────┬────────────┬─────────┬────────────┐  │   │
│  │ │Group Name  │Description │Members  │Actions     │  │   │
│  │ ├────────────┼────────────┼─────────┼────────────┤  │   │
│  │ │Developers  │Dev team    │   5     │[Edit][Del] │  │   │
│  │ │QA Team     │Quality     │   3     │[Edit][Del] │  │   │
│  │ │Marketing   │Marketing   │   8     │[Edit][Del] │  │   │
│  │ └────────────┴────────────┴─────────┴────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Pagination Controls                                       │
└─────────────────────────────────────────────────────────────┘
```

#### Group Management Features
- **Member Management**: Add/remove users from groups
- **Permission Assignment**: Assign roles and permissions to groups
- **Bulk Operations**: Import/export group memberships
- **Group Hierarchy**: Support for nested groups
- **Templates**: Pre-defined group templates

### 7. RBAC & Permissions (`/dashboard/permissions`)

#### Permissions Overview (`/dashboard/permissions/permissions`)

```
┌─────────────────────────────────────────────────────────────┐
│  Page Header: "Permissions & Roles"                       │
│  [Roles] [Permissions] [Assignments] [Audit]              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐   │
│  │     ROLES       │ │  PERMISSIONS    │ │ ASSIGNMENTS │   │
│  │                 │ │                 │ │             │   │
│  │ • Admin         │ │ • read_docs     │ │ User → Role │   │
│  │ • Editor        │ │ • write_docs    │ │ Group → Role│   │
│  │ • Viewer        │ │ • delete_docs   │ │ Role → Perm │   │
│  │                 │ │ • manage_users  │ │             │   │
│  │ [Manage Roles]  │ │ [Manage Perms]  │ │ [Manage]    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Permission Matrix                        │   │
│  │                                                     │   │
│  │        │ read │write│delete│manage│                │   │
│  │ Admin  │  ✓   │  ✓  │  ✓   │  ✓   │                │   │
│  │ Editor │  ✓   │  ✓  │  ✗   │  ✗   │                │   │
│  │ Viewer │  ✓   │  ✗  │  ✗   │  ✗   │                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### Role Assignment Interface
- **Drag & Drop**: Intuitive role assignment with drag-and-drop
- **Bulk Assignment**: Select multiple users for role assignment
- **Effective Permissions**: View calculated permissions for users
- **Permission Conflicts**: Identify and resolve permission conflicts
- **Audit Trail**: Track all permission changes

### 8. System Management (`/dashboard/system`) - ROOT Only

#### System Health Dashboard (`/dashboard/system/health`)

```
┌─────────────────────────────────────────────────────────────┐
│  Page Header: "System Health & Monitoring"                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Database  │ │  Cache   │ │   API    │ │ Sessions │      │
│  │ ✅ Good  │ │ ✅ Good  │ │ ✅ Good  │ │ ✅ Good  │      │
│  │ 12ms     │ │  2ms     │ │ 45ms     │ │   45     │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │              System Statistics                      │   │
│  │                                                     │   │
│  │ • Total Users: 150 (↑5 today)                     │   │
│  │ • Active Sessions: 45 (peak: 67)                  │   │
│  │ • API Requests: 1,234 (last hour)                 │   │
│  │ • Error Rate: 0.1% (acceptable)                   │   │
│  │ • Uptime: 99.9% (last 30 days)                    │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │               Recent System Events                  │   │
│  │                                                     │   │
│  │ 🟢 System backup completed successfully            │   │
│  │ 🟡 High memory usage detected (85%)               │   │
│  │ 🟢 Database optimization completed                 │   │
│  │ 🔴 Failed login attempts from IP 192.168.1.100   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 9. Responsive Design Considerations

#### Mobile Layout (< 768px)
- **Collapsible Sidebar**: Hamburger menu navigation
- **Stacked Cards**: Statistics cards stack vertically
- **Touch-Friendly**: Larger touch targets and spacing
- **Simplified Tables**: Horizontal scroll or card view for tables
- **Bottom Navigation**: Easy thumb access for primary actions

#### Tablet Layout (768px - 1024px)
- **Adaptive Sidebar**: Collapsible but wider when expanded
- **Grid Adjustments**: 2-column layouts instead of 3-column
- **Touch Optimization**: Hybrid mouse/touch interaction

#### Desktop Layout (> 1024px)
- **Full Sidebar**: Persistent navigation sidebar
- **Multi-column**: Optimal use of screen real estate
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Advanced Features**: Drag-and-drop, context menus

## Component Library & Design System

### Color Palette
```css
:root {
  /* Primary Colors */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-700: #1d4ed8;
  
  /* Status Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #06b6d4;
  
  /* Neutral Colors */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-500: #6b7280;
  --gray-900: #111827;
}
```

### Typography Scale
```css
/* Headings */
.text-3xl { font-size: 1.875rem; } /* Page titles */
.text-2xl { font-size: 1.5rem; }   /* Section titles */
.text-xl  { font-size: 1.25rem; }  /* Card titles */
.text-lg  { font-size: 1.125rem; } /* Subsections */

/* Body Text */
.text-base { font-size: 1rem; }    /* Default text */
.text-sm   { font-size: 0.875rem; } /* Secondary text */
.text-xs   { font-size: 0.75rem; }  /* Captions */
```

### Component Specifications

#### Button Components
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
}
```

#### Form Components
```typescript
interface FormFieldProps {
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRules;
  error?: string;
  helpText?: string;
}
```

#### Data Table Component
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  pagination: PaginationConfig;
  sorting: SortConfig;
  filtering: FilterConfig;
  selection?: SelectionConfig;
  actions?: ActionConfig<T>;
}
```

## Accessibility Features

### WCAG 2.1 Compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Contrast**: Minimum 4.5:1 contrast ratio
- **Focus Management**: Clear focus indicators and logical tab order
- **Alternative Text**: Images and icons have appropriate alt text

### Inclusive Design
- **High Contrast Mode**: Support for high contrast themes
- **Text Scaling**: Support for 200% text zoom
- **Motion Preferences**: Respect prefers-reduced-motion
- **Language Support**: Internationalization ready

## Performance Optimization

### Loading Strategies
- **Progressive Loading**: Load critical content first
- **Skeleton Screens**: Show content placeholders while loading
- **Infinite Scroll**: For large data sets
- **Optimistic Updates**: Immediate UI feedback

### Bundle Optimization
- **Code Splitting**: Route-based and component-based
- **Tree Shaking**: Remove unused code
- **Asset Optimization**: Optimized images and fonts
- **Caching Strategy**: Intelligent browser caching

## Error Handling & User Feedback

### Error States
- **Network Errors**: Retry mechanisms and offline support
- **Validation Errors**: Inline validation with helpful messages
- **Permission Errors**: Clear explanations and suggested actions
- **Server Errors**: User-friendly error pages with support contact

### Loading States
- **Skeleton Loading**: Content placeholders
- **Progress Indicators**: For long operations
- **Optimistic UI**: Immediate feedback for user actions
- **Background Operations**: Non-blocking operations with notifications

## Security Considerations

### Frontend Security
- **Input Sanitization**: Prevent XSS attacks
- **CSRF Protection**: Token-based CSRF protection
- **Secure Authentication**: Secure token storage and handling
- **Privacy**: No sensitive data in client-side storage

### User Privacy
- **Data Minimization**: Only collect necessary data
- **Audit Logging**: Track all user actions
- **Session Management**: Secure session handling
- **Permission Enforcement**: Client-side permission checks

## Key Features Summary

### For ROOT Users:
- Full system access and monitoring
- Create/manage ROOT and ADMIN users
- System health dashboard
- Global settings management
- Access to all projects and users

### For ADMIN Users:
- Manage assigned projects
- Create/manage CONSUMER users
- User group management
- RBAC permission assignment
- Project-specific analytics

### Security Features:
- Role-based route protection
- Token-based authentication
- Input validation and sanitization
- Audit logging for all actions
- Session management and timeouts

### Performance Features:
- Code splitting and lazy loading
- Server-side pagination
- Optimistic UI updates
- Intelligent caching
- Progressive loading states

This design provides a comprehensive framework for building a powerful, secure, and user-friendly admin dashboard for the Magic Auth system. 