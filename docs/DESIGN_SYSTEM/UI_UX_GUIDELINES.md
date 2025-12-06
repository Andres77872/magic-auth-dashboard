# UI/UX Guidelines - Magic Auth Dashboard

**Version:** 1.0  
**Last Updated:** October 12, 2025  
**Status:** ✅ Production Standard

> Comprehensive UI/UX rules and design declarations for building a modern, unified dashboard management application for users, projects, groups, permissions, system status, and audit logs.

---

## Table of Contents

1. [Size Naming Standard](#-size-naming-standard-mandatory)
2. [Design Principles](#-design-principles)
3. [Visual Design System](#-visual-design-system)
4. [Component Usage Rules](#-component-usage-rules)
5. [Interaction Patterns](#-interaction-patterns)
6. [Accessibility Standards](#-accessibility-standards)
7. [Dashboard Patterns](#-dashboard-patterns)

---

## Size Naming Standard (MANDATORY)

**Rule:** Always use short size names, never long descriptive names.

### ✅ Correct Naming

```tsx
// Component props
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// CSS classes
.btn-sm
.btn-md
.btn-lg

// TypeScript interfaces
size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
```

### ❌ Incorrect Naming (Never Use)

```tsx
// ❌ WRONG - Do not use long names
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
<Button size="large">Large</Button>

// ❌ WRONG - Do not use in interfaces
size?: 'small' | 'medium' | 'large'

// ❌ WRONG - Do not use in CSS
.btn-small
.btn-medium
.btn-large
```

### Standard Size Scale

**Component-Specific Sizes:**

| Component | xs | sm | md | lg | xl |
|-----------|----|----|----|----|-----|
| **Button Height** | 28px | 32px | 40px ⭐ | 48px | - |
| **Icon Size** | 12px | 16px | 20px ⭐ | 24px | 32px |
| **Modal Width** | - | 400px | 600px ⭐ | 800px | 1000px |
| **Card Padding** | - | 16px | 24px ⭐ | 32px | - |
| **Badge Height** | - | 20px | 24px ⭐ | 28px | - |
| **Border Radius** | - | 4px | 8px ⭐ | 12px | - |
| **Typography** | 12px | 14px | 16px ⭐ | 18px | 20px |

⭐ = Default size

**Key Rules:**
- **Icons:** Use numeric values directly: `<UserIcon size={20} />`
- **Components:** Use string size names: `<Button size="md" />`
- **CSS Classes:** Use short names: `.btn-sm`, `.shadow-md`, `.rounded-lg`
- **Always use** `md` as default unless specified otherwise

**Applies to:** All components (Button, Badge, Modal, Card), CSS classes, TypeScript interfaces, and documentation examples.

---

## Design Principles

### 1. Clarity Over Complexity
**Rule:** Every UI element must have a clear, singular purpose.

```tsx
// ✅ Good - Clear, focused action
<Button variant="primary" onClick={createUser}>
  <PlusIcon size={16} />
  Add User
</Button>

// ❌ Bad - Confusing multi-purpose button
<Button onClick={handleClick}>Add/Edit/Delete User</Button>
```

**Application:**
- Use clear, action-oriented labels
- One primary action per screen section
- Group related actions logically
- Avoid ambiguous terminology

---

### 2. Consistency is Mandatory
**Rule:** Use the same pattern for the same action across the entire application.

**Mandatory Consistency Requirements:**
- ✅ Delete actions → Always red danger buttons
- ✅ Save/Create actions → Always primary blue buttons
- ✅ Cancel actions → Always outline/ghost buttons
- ✅ Modal dialogs → Same structure everywhere
- ✅ Form validation → Same location and style
- ✅ Icons → Same meaning everywhere

```tsx
// ✅ Consistent pattern for all delete confirmations
<ConfirmDialog
  title="Delete User"
  message="Are you sure? This action cannot be undone."
  confirmLabel="Delete"
  confirmVariant="danger"
  onConfirm={handleDelete}
/>
```

---

### 3. Progressive Disclosure
**Rule:** Show only what users need at each step. Reveal complexity gradually.

**Application:**
- Hide advanced features behind expandable sections
- Use tabs to separate concerns
- Show summaries before details
- Implement "Show more" patterns for long lists
- Don't overwhelm users with all options at once

---

### 4. Immediate Feedback
**Rule:** Every user action must receive instant visual feedback.

**Required Feedback Types:**

| Action | Feedback Required |
|--------|-------------------|
| Button click | Loading state, disabled state |
| Form submission | Loading spinner → success/error toast |
| Data loading | Skeleton screens or spinners |
| Hover | Visual hover state |
| Focus | Clear focus ring (WCAG 2.2) |
| Error | Inline validation with icon |
| Success | Toast notification |

```tsx
// ✅ Good - Complete feedback cycle
const [isLoading, setIsLoading] = useState(false);

<Button 
  variant="primary" 
  loading={isLoading}
  onClick={async () => {
    setIsLoading(true);
    try {
      await saveUser(data);
      toast.success('User saved successfully');
    } catch (error) {
      toast.error('Failed to save user');
    } finally {
      setIsLoading(false);
    }
  }}
>
  Save User
</Button>
```

---

### 5. Data Hierarchy
**Rule:** Establish clear visual hierarchy for information importance.

**Hierarchy Levels:**

1. **Primary Information** → `text-2xl font-bold` (Page titles, key metrics)
2. **Secondary Information** → `text-base text-secondary` (Descriptions, content)
3. **Tertiary Information** → `text-xs text-tertiary` (Timestamps, metadata)

---

## Visual Design System

### Color Usage Rules

#### Primary Colors - Action & Focus
```css
--color-primary-500: #3B82F6  /* Main actions */
--color-primary-600: #2563EB  /* Hover states */
```

**Usage Rules:**
- ✅ Primary action buttons
- ✅ Links and active navigation
- ✅ Focus indicators
- ✅ Selected states
- ❌ Never for errors
- ❌ Never for large backgrounds

---

#### Semantic Colors - Status Communication

**Success (Green):** `--color-success-500: #10B981`
- ✅ Success messages and toasts
- ✅ Completed status badges
- ✅ Positive metrics
- ❌ Never for destructive actions

**Warning (Amber):** `--color-warning-500: #F59E0B`
- ✅ Warning messages and alerts
- ✅ Pending/in-progress states
- ❌ Never for final error states

**Error (Red):** `--color-error-500: #EF4444`
- ✅ Error messages and validation
- ✅ Destructive action buttons (delete)
- ✅ Failed states
- ❌ Never for positive actions

**Info (Blue):** `--color-info-500: #3B82F6`
- ✅ Informational messages
- ✅ Tooltips and help text

---

#### Text & Background Colors

**Text Hierarchy:**
```css
--color-text-primary: #1A1A1A    /* Primary content */
--color-text-secondary: #6B7280  /* Supporting content */
--color-text-tertiary: #9CA3AF   /* De-emphasized content */
```

**Background Hierarchy:**
```css
--color-bg-primary: #FFFFFF      /* Main background */
--color-bg-secondary: #F9FAFB    /* Secondary surfaces */
--color-bg-tertiary: #F3F4F6     /* Tertiary surfaces */
```

**Rules:**
- ✅ Use semantic colors only for status, not decoration
- ✅ Maintain 4.5:1 contrast for text (WCAG AA)
- ✅ Maintain 3:1 contrast for UI elements (WCAG AA)

---

### Typography Rules

#### Font Families
```css
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

**Usage:**
- ✅ Sans-serif for all UI text
- ✅ Monospace for: API keys, code, logs, UUIDs
- ❌ Never mix fonts within a sentence

---

#### Type Scale (Strict)

| Size | Pixels | Use Case |
|------|--------|----------|
| `3xl` | 30px | Hero titles only |
| `2xl` | 24px | Page titles |
| `xl` | 20px | Section headings |
| `lg` | 18px | Subsection headings |
| `base` | 16px | Body text (default) |
| `sm` | 14px | Secondary text, tables |
| `xs` | 12px | Labels, timestamps |
| `2xs` | 10px | Minimal labels only |

**Application Rules:**

```tsx
// ✅ Good - Proper hierarchy
<h1 className="text-2xl font-bold mb-6">User Management</h1>
<Card>
  <h2 className="text-lg font-semibold mb-4">Active Users</h2>
  <p className="text-base text-secondary">Manage all active users</p>
  <span className="text-xs text-tertiary">Last updated: 5 min ago</span>
</Card>
```

---

### Spacing Rules (8px Grid)

**Mandatory Spacing Scale:**

| Token | Size | Use Case |
|-------|------|----------|
| `spacing-1` | 4px | Minimal spacing |
| `spacing-2` | 8px | Tight spacing (icon + text) |
| `spacing-3` | 12px | Compact spacing |
| `spacing-4` | 16px | Standard spacing (form fields) |
| `spacing-6` | 24px | Comfortable spacing (cards) |
| `spacing-8` | 32px | Loose spacing (sections) |
| `spacing-12` | 48px | Section breaks |

**Common Applications:**

| Element | Spacing | Class |
|---------|---------|-------|
| Icon + Text | 8px | `gap-2` |
| Button padding | 12px × 16px | `px-4 py-3` |
| Card padding | 24px | `p-6` |
| Form field gap | 16px | `gap-4` |
| Section margin | 32px | `mb-8` |
| Page sections | 48px | `mb-12` |

```tsx
// ✅ Good - Consistent spacing
<div className="flex items-center gap-2">
  <UserIcon size={16} />
  <span>John Doe</span>
</div>

<Card className="p-6">
  <h3 className="mb-4">Title</h3>
</Card>

// ❌ Bad - Arbitrary values
<div style={{ gap: '13px' }}>...</div>
```

---

### Border & Radius Rules

**Border Radius:**

| Radius | Size | Use Case |
|--------|------|----------|
| `sm` | 4px | Badges, tags |
| `md` | 8px | Buttons, inputs |
| `lg` | 12px | Cards, modals |
| `full` | 9999px | Pills, avatars |

**Usage Rules:**
- ✅ Small (4px): Badges, pills, tags
- ✅ Medium (8px): Buttons, form inputs
- ✅ Large (12px): Cards, modals
- ✅ Full: Avatars, circular indicators
- ❌ Never use sharp corners except tables

---

### Shadow System

**Shadow Hierarchy:**

| Shadow | Elevation | Use Case |
|--------|-----------|----------|
| `sm` | Low | Cards (default) |
| `md` | Medium | Cards (hover), tooltips |
| `lg` | High | Dropdowns, popovers |
| `xl` | Highest | Modals, dialogs |

```tsx
// ✅ Good - Proper elevation
<Card className="shadow-sm hover:shadow-md">Hoverable card</Card>
<Modal className="shadow-xl">Modal content</Modal>
```

---

## Component Usage Rules

### Button Hierarchy (STRICT)

**Variant Usage:**

| Variant | When to Use | Example |
|---------|-------------|---------|
| `primary` | Main action, create/save | Add User, Save |
| `secondary` | Less important actions | View Details |
| `outline` | Cancel, alternative | Cancel, Back |
| `ghost` | Icon-only, subtle | Edit icon, Delete icon |
| `danger` | Destructive actions ONLY | Delete, Remove |

```tsx
// ✅ Good - Correct variants
<div className="flex gap-2">
  <Button variant="outline" onClick={onCancel}>Cancel</Button>
  <Button variant="primary" onClick={onSave}>Save Changes</Button>
</div>

<Button variant="danger" onClick={onDelete}>
  <DeleteIcon size={16} />
  Delete User
</Button>

// ❌ Bad - Wrong variants
<Button variant="primary" onClick={onDelete}>Delete</Button>
<Button variant="danger" onClick={onCreate}>Create</Button>
```

**Size Rules:**

| Size | Height | Padding | Icon Size | Use Case |
|------|--------|---------|-----------|----------|
| `xs` | 28px | 8px × 12px | 12px | Dense tables, inline actions |
| `sm` | 32px | 8px × 16px | 14-16px | Table actions, compact UI |
| `md` | 40px | 12px × 20px | 16-20px | **Default** - Most buttons |
| `lg` | 48px | 16px × 24px | 20-24px | Hero CTAs, primary actions |

```tsx
// ✅ Good - Correct sizes with icons
<Button size="xs"><PlusIcon size={12} />Add</Button>
<Button size="sm"><EditIcon size={16} />Edit</Button>
<Button size="md"><SaveIcon size={16} />Save</Button>
<Button size="lg"><CheckIcon size={20} />Submit</Button>
```

---

### Form Field Rules (MANDATORY)

**Required Structure:**

```tsx
<div className="form-field">
  {/* Label - REQUIRED */}
  <label htmlFor="fieldId" className="form-label">
    Field Label
    {isRequired && <span className="text-error ml-1">*</span>}
  </label>

  {/* Input with proper states */}
  <input
    id="fieldId"
    type="text"
    className={`form-input ${error ? 'form-input-error' : ''}`}
    aria-required={isRequired}
    aria-invalid={!!error}
    aria-describedby={error ? 'fieldId-error' : undefined}
  />

  {/* Helper text - OPTIONAL */}
  {helperText && (
    <span className="form-hint">{helperText}</span>
  )}

  {/* Error message - CONDITIONAL */}
  {error && (
    <span id="fieldId-error" className="form-error" role="alert">
      <ErrorIcon size={14} aria-hidden="true" />
      {error}
    </span>
  )}
</div>
```

**Rules:**
- ✅ Every input MUST have a label
- ✅ Use `htmlFor` and `id` association
- ✅ Show required with red asterisk
- ✅ Display errors inline below field
- ✅ Use semantic HTML
- ❌ NEVER use placeholders as labels
- ❌ NEVER show errors in separate modals

---

### Table Rules

**Standard Structure:**

```tsx
<div className="card p-0">
  {/* Header - REQUIRED */}
  <div className="card-header">
    <h3 className="card-title">Table Title</h3>
    <div className="flex items-center gap-2">
      <SearchInput />
      <Button variant="primary" size="sm">
        <PlusIcon size={14} />
        Add New
      </Button>
    </div>
  </div>

  {/* Table with scroll */}
  <div className="table-container">
    <table className="table">
      <thead className="table-header">
        <tr>
          <th className="table-header-cell">Name</th>
          <th className="table-header-cell">Email</th>
          <th className="table-header-cell">Status</th>
          <th className="table-header-cell text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="table-body">
        {data.map(row => (
          <tr key={row.id} className="table-row">
            <td className="table-cell">{row.name}</td>
            <td className="table-cell">{row.email}</td>
            <td className="table-cell">
              <Badge variant="success">{row.status}</Badge>
            </td>
            <td className="table-cell text-right">
              <Button variant="ghost" size="sm" aria-label="Edit">
                <EditIcon size={14} />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Pagination - REQUIRED for >10 rows */}
  <div className="card-footer">
    <Pagination 
      currentPage={page}
      totalPages={totalPages}
      onPageChange={setPage}
    />
  </div>
</div>
```

**Rules:**
- ✅ Wrap tables in cards
- ✅ Use `table-container` for scroll
- ✅ Actions column ALWAYS on right
- ✅ Use badges for status
- ✅ Pagination required for >10 items
- ✅ Show skeleton during loading
- ✅ Show empty state with illustration
- ❌ Never show >50 rows without pagination
- ❌ Never put actions on left

---

### Modal Rules

**Standard Structure:**

```tsx
<Modal onClose={onClose}>
  <Modal.Header>
    <h2 className="modal-title">Modal Title</h2>
    <button className="modal-close" onClick={onClose} aria-label="Close">
      <CloseIcon size={20} />
    </button>
  </Modal.Header>

  <Modal.Content>
    <p className="text-sm text-secondary mb-4">Instructions here</p>
    {/* Form or content */}
  </Modal.Content>

  <Modal.Footer>
    <Button variant="outline" onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={onConfirm}>Confirm</Button>
  </Modal.Footer>
</Modal>
```

**Rules:**
- ✅ Always include close button (X)
- ✅ Cancel left, confirm right
- ✅ Use semantic variants (danger for delete)
- ✅ Close on ESC key
- ✅ Focus trap within modal
- ❌ Never use for large forms (use pages)
- ❌ Never nest modals

**Size Guidelines:**
- Small (400px): Confirmations, 1-2 fields
- Medium (600px): Standard forms, 3-5 fields
- Large (800px): Complex forms, 6+ fields

---

### Badge Rules

**Variant Mapping:**

| Status | Variant | Example |
|--------|---------|---------|
| Active, Success, Completed | `success` | Active User |
| Pending, In Progress | `warning` | Processing |
| Inactive, Failed, Error | `error` | Failed Job |
| Info, Role, Default | `primary` | Admin Role |
| Neutral | `secondary` | Member |

```tsx
// ✅ Good - Semantic usage
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Suspended</Badge>

// ❌ Bad - Wrong mapping
<Badge variant="error">Active</Badge>
<Badge variant="success">Failed</Badge>
```

---

## Interaction Patterns

### Hover States (MANDATORY)

All interactive elements must have hover feedback:

**Buttons:**
```css
.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

**Cards (clickable):**
```css
.card-clickable:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-hover);
}
```

**Rules:**
- ✅ All interactive elements need hover
- ✅ Use subtle lift (1-2px translateY)
- ✅ Increase shadow on hover
- ❌ Never use drastic color changes
- ❌ Never disable hover states

---

### Focus States (WCAG 2.2 REQUIRED)

**Universal Focus:**
```css
*:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

@media (prefers-contrast: high) {
  *:focus-visible {
    outline-width: 4px;
  }
}
```

**Rules:**
- ✅ Use `:focus-visible` (not `:focus`)
- ✅ 2px minimum outline width
- ✅ 2px outline offset
- ✅ Use primary color
- ✅ Test keyboard navigation
- ❌ NEVER `outline: none` without alternative
- ❌ NEVER invisible focus states

---

### Loading States

**Button Loading:**
```tsx
<Button loading={isLoading} disabled={isLoading}>
  {isLoading ? 'Processing...' : 'Submit'}
</Button>
```

**Page Loading:**
```tsx
{isLoading ? <Skeleton variant="list" rows={5} /> : <DataTable data={data} />}
```

**Rules:**
- ✅ Show skeleton for page loads
- ✅ Show spinner in buttons
- ✅ Disable during loading
- ✅ Show progress for long operations
- ❌ Never show blank screens

---

## Accessibility Standards (WCAG 2.2 AA)

### Keyboard Navigation (MANDATORY)

**Requirements:**
- ✅ All interactive elements focusable
- ✅ Logical tab order
- ✅ Visible focus indicators
- ✅ Skip links for navigation
- ✅ ESC closes modals/dropdowns
- ✅ Arrow keys for lists/menus
- ✅ Enter/Space activates buttons

**Testing:**
```
Tab → Navigate forward
Shift+Tab → Navigate backward
Enter/Space → Activate
ESC → Close/Cancel
Arrow keys → Navigate lists
```

---

### Screen Reader Support

**Requirements:**
- ✅ Semantic HTML (`<button>`, `<nav>`, `<main>`)
- ✅ Alt text for images
- ✅ ARIA labels for icon buttons
- ✅ ARIA live regions for dynamic content
- ✅ Form labels properly associated
- ✅ Error messages announced

```tsx
// ✅ Good - Accessible button
<button aria-label="Delete user">
  <DeleteIcon aria-hidden="true" />
</button>

// ✅ Good - Accessible form
<label htmlFor="email">Email</label>
<input id="email" aria-required="true" aria-invalid={hasError} />
{hasError && <span role="alert">{error}</span>}
```

---

### Color Contrast (WCAG AA)

**Requirements:**
- ✅ Text: 4.5:1 minimum contrast
- ✅ Large text (18px+): 3:1 minimum
- ✅ UI components: 3:1 minimum
- ✅ Focus indicators: 3:1 minimum

**Testing Tools:**
- Chrome DevTools Lighthouse
- axe DevTools
- WebAIM Contrast Checker

---

## Dashboard Patterns

### Page Header (MANDATORY)

Every page must have this structure:

```tsx
<div className="page-container">
  <header className="page-header mb-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Page Title</h1>
        <p className="text-sm text-secondary mt-1">Description</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline">
          <ExportIcon size={16} />
          Export
        </Button>
        <Button variant="primary">
          <PlusIcon size={16} />
          Add New
        </Button>
      </div>
    </div>
  </header>
  
  <main className="page-content">
    {/* Content */}
  </main>
</div>
```

**Rules:**
- ✅ Title: `text-2xl font-bold`
- ✅ Description: `text-sm text-secondary`
- ✅ Primary action on right
- ✅ 24px margin below header
- ❌ Never omit page header
- ❌ Never place actions on left

---

### Stats Card Pattern

```tsx
<Card className="p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold">Total Users</h3>
    <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
      <UserIcon size={20} className="text-primary" />
    </div>
  </div>
  <div className="text-3xl font-bold mb-2">1,234</div>
  <div className="flex items-center gap-1 text-sm">
    <span className="text-success">+12%</span>
    <span className="text-secondary">vs last month</span>
  </div>
</Card>
```

**Rules:**
- ✅ Icon in colored circle (top right)
- ✅ Metric: `text-3xl font-bold`
- ✅ Trend with semantic color
- ✅ Comparison text

---

### Grid Layouts (RESPONSIVE)

**4-Column Stats Grid:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {stats.map(stat => <StatCard key={stat.id} {...stat} />)}
</div>
```

**3-Column Content Grid:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {projects.map(project => <ProjectCard key={project.id} {...project} />)}
</div>
```

**Rules:**
- ✅ Always start with `grid-cols-1` (mobile-first)
- ✅ Use `gap-6` (24px) for cards
- ✅ Breakpoints: sm (640px), md (768px), lg (1024px)
- ❌ Never >4 columns
- ❌ Never <16px gap

---

### Empty States

```tsx
<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
    <SmileyIcon size={40} className="text-gray-400" />
  </div>
  <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
  <p className="text-sm text-secondary max-w-300 mb-6">
    Get started by creating your first project
  </p>
  <Button variant="primary">
    <PlusIcon size={16} />
    Create Project
  </Button>
</div>
```

**Rules:**
- ✅ Centered layout
- ✅ Icon/illustration
- ✅ Helpful message
- ✅ Clear CTA
- ✅ Use for empty tables/lists

---

## Quick Reference

### Must Follow Rules

1. **Consistency** → Same action = same UI pattern everywhere
2. **Accessibility** → WCAG 2.2 AA minimum
3. **Feedback** → Immediate response to every action
4. **Hierarchy** → Clear visual information hierarchy
5. **Tokens** → Always use design tokens, never hardcode
6. **Semantic HTML** → Use proper HTML elements
7. **Keyboard** → All features keyboard accessible
8. **Focus** → Visible focus indicators required
9. **Colors** → Semantic meaning (not decoration)
10. **Loading** → Show loading states, never blank screens

---

## Related Documentation

- **[Component Inventory](./COMPONENT_INVENTORY.md)** - Complete component catalog
- **[Icon System](./ICON_SYSTEM.md)** - Icon documentation
- **[Utility Classes](./UTILITY_CLASSES.md)** - Utility reference
- **[Size Specifications](./SIZE_SPECIFICATIONS.md)** - Exact pixel values reference

---

**Maintained by:** Design System Team  
**Last Review:** 2025-10-12  
**Questions?** Create issue with `design-system` label
