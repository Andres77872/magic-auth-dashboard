# Inline Styles Migration Guide

This guide provides CSS class replacements for all hardcoded inline styles identified in the hardcoded styles audit. Use this reference to refactor components and remove inline styling.

## Quick Reference

### Common Layout Patterns

| Hardcoded Style | CSS Class | Description |
|----------------|-----------|-------------|
| `style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}` | `flex-between-center` | Flex layout with space-between and center alignment |
| `style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}` | `flex-between-start` | Flex layout with space-between and flex-start alignment |
| `style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}` | `flex-center-center` | Flex layout with center justification and alignment |
| `style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}` | `flex-end-center` | Flex layout with flex-end justification |
| `style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}` | `flex-col-gap-3` | Flex column with gap |
| `style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}` | `flex-wrap-gap-4` | Flex with wrap and gap |

### Grid Layouts

| Hardcoded Style | CSS Class | Description |
|----------------|-----------|-------------|
| `style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}` | `grid-2-cols-gap-6` | 2-column grid with gap |
| `style={{ display: 'grid', gap: '1rem' }}` | `grid-gap-4` | Grid with gap |
| `style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}` | `grid-auto-fit-gap-4` | Auto-fit grid with minimum width |

### Spacing

| Hardcoded Style | CSS Class | Description |
|----------------|-----------|-------------|
| `style={{ marginBottom: '1.5rem' }}` | `mb-6` | Bottom margin 24px |
| `style={{ marginBottom: '2rem' }}` | `mb-8` | Bottom margin 32px |
| `style={{ marginTop: '1rem' }}` | `mt-4` | Top margin 16px |
| `style={{ marginLeft: '8px' }}` | `ml-2` | Left margin 8px |
| `style={{ padding: '1rem' }}` | `p-4` | Padding 16px |
| `style={{ padding: '0.75rem' }}` | `p-3` | Padding 12px |

### Sizing

| Hardcoded Style | CSS Class | Description |
|----------------|-----------|-------------|
| `style={{ minWidth: '250px' }}` | `min-w-250` | Minimum width 250px |
| `style={{ minWidth: '400px' }}` | `min-w-400` | Minimum width 400px |
| `style={{ maxHeight: '300px', overflowY: 'auto' }}` | `max-h-300 overflow-y-auto` | Max height with scroll |
| `style={{ width: '100%' }}` | `w-full` | Full width |

### Typography

| Hardcoded Style | CSS Class | Description |
|----------------|-----------|-------------|
| `style={{ fontSize: '0.875rem' }}` | `text-sm` | Small font size |
| `style={{ fontSize: '0.75rem' }}` | `text-xs` | Extra small font size |
| `style={{ fontWeight: '500' }}` | `font-medium` | Medium font weight |
| `style={{ fontFamily: 'monospace', fontSize: '0.9em' }}` | `text-mono` | Monospace font |
| `style={{ color: 'var(--color-text-secondary)' }}` | `text-secondary` | Secondary text color |

### Colors and Backgrounds

| Hardcoded Style | CSS Class | Description |
|----------------|-----------|-------------|
| `style={{ backgroundColor: 'var(--color-error-light)' }}` | `bg-error-light` | Error background |
| `style={{ backgroundColor: 'var(--color-primary-50)' }}` | `bg-primary-50` | Light primary background |
| `style={{ color: 'var(--color-danger)' }}` | `text-error` | Error text color |
| `style={{ border: '1px solid var(--color-border)' }}` | `border` | Standard border |

## Component-Specific Migrations

### GroupCard.tsx

**Before:**
```tsx
<div className="group-stats" style={{ 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '0.75rem' 
}}>
  <div className="stat-item" style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  }}>
    <span className="stat-value" style={{ fontSize: '0.875rem' }}>
      {member_count}
    </span>
  </div>
</div>
```

**After:**
```tsx
<div className="group-stats flex-col-gap-3">
  <div className="stat-item flex-between-center">
    <span className="stat-value text-sm">
      {member_count}
    </span>
  </div>
</div>
```

### GroupFilter.tsx

**Before:**
```tsx
<div className="group-filters" style={{ 
  marginBottom: '1.5rem',
  padding: '1rem',
  backgroundColor: 'var(--color-background-secondary)',
  borderRadius: '8px',
  border: '1px solid var(--color-border)'
}}>
  <div className="filter-row" style={{ 
    display: 'flex', 
    gap: '1rem', 
    alignItems: 'center',
    flexWrap: 'wrap'
  }}>
```

**After:**
```tsx
<div className="group-filters-container mb-6">
  <div className="filter-row-flex">
```

### GroupForm.tsx

**Before:**
```tsx
<div 
  className="error-banner" 
  style={{ 
    padding: '0.75rem',
    marginBottom: '1rem',
    backgroundColor: 'var(--color-danger-light)',
    border: '1px solid var(--color-danger)',
    borderRadius: '4px',
    color: 'var(--color-danger-dark)'
  }}
>
```

**After:**
```tsx
<div className="error-banner">
```

### ProjectMembersTab.tsx

**Before:**
```tsx
<div style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  marginBottom: '24px' 
}}>
```

**After:**
```tsx
<div className="members-header">
```

**Before:**
```tsx
<div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
```

**After:**
```tsx
<div className="loading-container">
```

**Before:**
```tsx
<div style={{ minWidth: '400px' }}>
```

**After:**
```tsx
<div className="modal-content-wide">
```

### ProjectOverviewTab.tsx

**Before:**
```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
```

**After:**
```tsx
<div className="project-overview-grid">
```

**Before:**
```tsx
<div style={{ fontFamily: 'monospace', fontSize: '0.9em', color: 'var(--color-text-secondary)' }}>
```

**After:**
```tsx
<div className="code-block">
```

### ProjectSettingsTab.tsx

**Before:**
```tsx
<div style={{ 
  padding: '16px', 
  backgroundColor: 'var(--color-error-bg)', 
  border: '1px solid var(--color-error)',
  borderRadius: '4px',
  marginBottom: '20px'
}}>
```

**After:**
```tsx
<div className="alert-danger">
```

**Before:**
```tsx
<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
```

**After:**
```tsx
<div className="button-group-end">
```

### GroupDetailsPage.tsx

**Before:**
```tsx
<div className="page-header" style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'flex-start',
  marginBottom: '2rem' 
}}>
```

**After:**
```tsx
<div className="page-header-flex">
```

**Before:**
```tsx
<p style={{ 
  color: 'var(--color-text-secondary)',
  marginTop: '0.5rem'
}}>
```

**After:**
```tsx
<p className="description-secondary">
```

**Before:**
```tsx
<div style={{ display: 'flex', gap: '0.5rem' }}>
```

**After:**
```tsx
<div className="button-group">
```

## New Utility Classes Added

### Layout Utilities
- `flex-between-center`, `flex-between-start`
- `flex-center-center`, `flex-end-center`
- `flex-col-gap-{1-6}`, `flex-gap-{1-6}`
- `flex-wrap-gap-{1-4}`
- `grid-{2-3}-cols-gap-{4,6}`
- `grid-auto-fit-gap-{4,6}`

### Spacing Utilities
- `gap-0-5`, `gap-12`
- `p-10`, `pt-10`, `pr-10`, `pb-10`, `pl-10`
- `mx-auto`

### Sizing Utilities
- `min-w-{200,250,300,400}`
- `max-w-{300,400,500}`
- `max-h-{300,500}`

### Typography Utilities
- `text-2xs`
- `font-mono`
- `text-mono`, `text-mono-xs`

### Color Utilities
- `bg-gray-100`, `bg-primary-50`
- `bg-success-light`, `bg-error-light`, `bg-warning-light`
- `border-primary`, `border-error`, `border-warning`

### Component-Specific Classes
- `error-banner`
- `field-hint`
- `form-group-spaced`
- `page-header-flex`
- `description-secondary`
- `button-group`, `button-group-end`, `button-group-center`
- `info-grid`, `info-item`
- `alert-danger`, `alert-warning`
- `modal-content-wide`, `modal-content-scrollable`
- `members-header`, `pagination-centered`
- `project-overview-grid`
- `code-block`
- `btn-danger-outline`

## Migration Process

1. **Find the component** in the hardcoded styles audit
2. **Locate the inline style** in the component file
3. **Find the equivalent CSS class** in this guide
4. **Replace the inline style** with the CSS class
5. **Remove the style prop** if it becomes empty
6. **Test the component** to ensure styling is preserved

## ESLint Rule Recommendation

To prevent future inline styling, add this ESLint rule to your configuration:

```json
{
  "rules": {
    "react/forbid-dom-props": ["error", { "forbid": ["style"] }]
  }
}
```

## Benefits of This Migration

1. **Better Performance** - CSS classes are more efficient than inline styles
2. **Consistency** - Centralized design system prevents style drift
3. **Maintainability** - Changes to spacing/colors can be made in one place
4. **Bundle Size** - Reduced JavaScript bundle size
5. **Caching** - CSS can be cached separately from JavaScript
6. **Responsive Design** - CSS classes support responsive variants
7. **Accessibility** - Better support for user preferences (reduced motion, high contrast)

## Next Steps

After completing the migration:

1. Remove unused inline style patterns
2. Add ESLint rules to prevent future inline styling
3. Create component-specific CSS files for complex components
4. Implement CSS-in-JS solution if needed for dynamic styling
5. Document the design system for team members 