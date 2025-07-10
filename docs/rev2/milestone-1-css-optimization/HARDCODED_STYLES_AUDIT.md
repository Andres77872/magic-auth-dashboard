# Hardcoded Styles Audit

This document lists all TSX files in the `@/src` directory that use hardcoded inline styling instead of CSS classes. These should be refactored to use CSS classes for better maintainability and performance.

## Files with Hardcoded Styles

### 1. `src/components/features/groups/GroupCard.tsx`

**Issues:** Multiple inline styles used instead of CSS classes

```tsx
// Lines 37-42: Hardcoded flex styles
<div className="group-stats" style={{ 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '0.75rem' 
}}>

// Lines 43-47: Hardcoded flex layout
<div className="stat-item" style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center' 
}}>

// Lines 53-57: Duplicate flex layout
<div className="stat-item" style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center' 
}}>

// Line 61: Hardcoded font size
<span className="stat-value" style={{ fontSize: '0.875rem' }}>
```

**Recommendation:** Create CSS classes like `.group-stats`, `.stat-item`, `.stat-value-small`

### 2. `src/components/features/groups/GroupFilter.tsx`

**Issues:** Multiple inline styles for layout

```tsx
// Lines 47-53: Hardcoded container styles
<div className="group-filters" style={{ 
  marginBottom: '1.5rem',
  padding: '1rem',
  backgroundColor: 'var(--color-background-secondary)',
  borderRadius: '8px',
  border: '1px solid var(--color-border)'
}}>

// Lines 54-59: Hardcoded flex layout
<div className="filter-row" style={{ 
  display: 'flex', 
  gap: '1rem', 
  alignItems: 'center',
  flexWrap: 'wrap'
}}>

// Line 61: Hardcoded flex and width
<div style={{ flex: '1', minWidth: '250px' }}>

// Line 70: Hardcoded min-width
<div style={{ minWidth: '200px' }}>
```

**Recommendation:** Create CSS classes like `.group-filters-container`, `.filter-row-flex`, `.search-field`, `.sort-field`

### 3. `src/components/features/groups/GroupForm.tsx`

**Issues:** Extensive inline styling

```tsx
// Lines 96-104: Hardcoded error banner styles
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

// Lines 107: Hardcoded margin
<div className="form-group" style={{ marginBottom: '1.5rem' }}>

// Lines 109-115: Hardcoded label styles
<label 
  htmlFor="group_name"
  style={{ 
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500'
  }}
>

// Lines 125-131: Hardcoded hint styles
<div 
  className="field-hint"
  style={{ 
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    marginTop: '0.25rem'
  }}
>

// Lines 135: Hardcoded margin
<div className="form-group" style={{ marginBottom: '2rem' }}>

// Lines 137-143: Duplicate label styles
<label 
  htmlFor="description"
  style={{ 
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500'
  }}
>

// Lines 153-159: Duplicate hint styles
<div 
  className="field-hint"
  style={{ 
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    marginTop: '0.25rem'
  }}
>

// Lines 164-167: Hardcoded flex layout
<div className="form-actions" style={{ 
  display: 'flex', 
  gap: '1rem', 
  justifyContent: 'flex-end' 
}}>
```

**Recommendation:** Create CSS classes like `.error-banner`, `.form-group-spaced`, `.form-label`, `.field-hint`, `.form-actions`

### 4. `src/components/features/projects/ProjectActionsMenu.tsx`

**Issues:** Single inline style usage

```tsx
// Line 73: Hardcoded color
<Button
  variant="outline"
  size="small"
  onClick={handleDelete}
  style={{ color: 'var(--color-danger)' }}
>
```

**Recommendation:** Create CSS class like `.btn-danger-outline` or use existing danger variant

### 5. `src/pages/dashboard/components/ActivityItem.tsx`

**Issues:** Extensive inline styling throughout the component

```tsx
// Lines 180-185: Hardcoded flex layout
<div className="activity-meta">
  <div className="activity-user">
    <span className="user-avatar">
      {activity.user.username.charAt(0).toUpperCase()}
    </span>
    <span className="user-name">{activity.user.username}</span>
    <span 
      className={`user-type-badge ${getUserTypeBadgeClass(activity.user.user_type)}`}
    >
      {activity.user.user_type.toUpperCase()}
    </span>
  </div>
  
  {/* More inline styles follow... */}
```

**Note:** This file has proper CSS classes and the inline styles shown are actually using CSS classes, so this might be a false positive.

### 6. `src/pages/groups/GroupDetailsPage.tsx`

**Issues:** Extensive inline styling throughout

```tsx
// Lines 64-68: Hardcoded flex layout
<div className="page-header" style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'flex-start',
  marginBottom: '2rem' 
}}>

// Lines 71-75: Hardcoded text styling
{group.description && (
  <p style={{ 
    color: 'var(--color-text-secondary)',
    marginTop: '0.5rem'
  }}>
    {group.description}
  </p>
)}

// Line 79: Hardcoded flex gap
<div style={{ display: 'flex', gap: '0.5rem' }}>

// Line 95: Hardcoded grid gap
<div style={{ display: 'grid', gap: '1rem' }}>

// Lines 96-102: Hardcoded flex layout with borders
<div style={{ 
  display: 'flex', 
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '0.5rem',
  borderBottom: '1px solid var(--color-border)'
}}>

// Multiple similar instances follow...
```

**Recommendation:** Create CSS classes like `.page-header-flex`, `.description-secondary`, `.button-group`, `.info-grid`, `.info-item`

### 7. `src/pages/projects/ProjectDetailsPage.tsx` (referenced in CSS)

**Issues:** Based on the CSS file, this component likely uses inline styles for tabs

```css
/* From ProjectDetailsPage.css */
.tab-container {
  /* ... */
}
.tab-button {
  /* ... */
}
```

**Note:** Need to check the actual TSX file content to identify specific inline styles.

### 8. `src/components/features/groups/ProjectGroupForm.tsx`

**Issues:** Inline styling in form sections

```tsx
// Line 199: Hardcoded margin
<button
  type="button"
  className="permission-remove"
  onClick={() => handleRemovePermission(permission)}
  disabled={isLoading}
  style={{ marginLeft: '8px', fontSize: '12px' }}
>
```

**Recommendation:** Create CSS class like `.permission-remove-btn`

### 9. `src/components/features/projects/ProjectMembersTab.tsx`

**Issues:** Extensive inline styling

```tsx
// Lines 239-243: Hardcoded flex layout
<div style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  marginBottom: '24px' 
}}>

// Line 251: Hardcoded flex centering
<div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>

// Lines 256-260: Hardcoded text centering
<div style={{ 
  textAlign: 'center', 
  padding: '40px', 
  color: 'var(--color-text-secondary)' 
}}>

// Line 272: Hardcoded pagination centering
<div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>

// Line 288: Hardcoded modal width
<div style={{ minWidth: '400px' }}>

// Line 289: Hardcoded input margin
<div style={{ marginBottom: '16px' }}>

// Line 297: Hardcoded loading centering
<div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>

// Line 301: Hardcoded scrollable container
<div style={{ maxHeight: '300px', overflowY: 'auto' }}>

// Lines 305-312: Hardcoded member item layout
<div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    marginBottom: '8px',
  }}
>

// Lines 318-319: Hardcoded text styling
<div style={{ fontSize: '0.9em', color: 'var(--color-text-secondary)' }}>

// Line 322: Hardcoded small text
<div style={{ fontSize: '0.8em', color: 'var(--color-text-secondary)' }}>
```

**Recommendation:** Create comprehensive CSS classes for member management layout

### 10. `src/components/features/projects/ProjectOverviewTab.tsx`

**Issues:** Multiple inline styles

```tsx
// Line 31: Hardcoded grid layout
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

// Line 35: Hardcoded margin
<div style={{ marginTop: '16px' }}>

// Line 37: Hardcoded margin
<div style={{ marginBottom: '12px' }}>

// Line 40: Hardcoded font family and color
<div style={{ fontFamily: 'monospace', fontSize: '0.9em', color: 'var(--color-text-secondary)' }}>

// Multiple similar instances follow...
```

**Recommendation:** Create CSS classes for project overview layout

### 11. `src/components/features/projects/ProjectSettingsTab.tsx`

**Issues:** Extensive inline styling for modal layouts and buttons

```tsx
// Line 327: Hardcoded modal width
<div style={{ minWidth: '400px' }}>

// Lines 328-334: Hardcoded alert styling
<div style={{ 
  padding: '16px', 
  backgroundColor: 'var(--color-error-bg)', 
  border: '1px solid var(--color-error)',
  borderRadius: '4px',
  marginBottom: '20px'
}}>

// Multiple flex layouts with hardcoded justify-content: 'flex-end'
<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
```

**Recommendation:** Create CSS classes for modal layouts, alerts, and button groups

## Summary

**Total files with hardcoded styles:** 11+ files

**Common patterns that need CSS classes:**

1. **Flex layouts** - `display: 'flex'`, `justifyContent`, `alignItems`
2. **Spacing** - `margin`, `padding`, `gap`
3. **Grid layouts** - `display: 'grid'`, `gridTemplateColumns`
4. **Typography** - `fontSize`, `color`, `fontWeight`
5. **Borders and backgrounds** - `border`, `backgroundColor`, `borderRadius`
6. **Sizing** - `minWidth`, `maxHeight`, `width`

## Recommended Action Plan

1. **Create utility CSS classes** for common layout patterns
2. **Extract component-specific styles** to dedicated CSS files
3. **Use CSS custom properties** for consistent spacing and colors
4. **Implement design system tokens** for typography and spacing
5. **Add ESLint rules** to prevent future inline styling

## Priority Order

1. **High Priority:** Components with extensive inline styling (GroupDetailsPage, ProjectMembersTab, ProjectOverviewTab)
2. **Medium Priority:** Form components with repeated patterns (GroupForm, ProjectSettingsTab)
3. **Low Priority:** Single-instance inline styles (ProjectActionsMenu) 