# Utility Classes Reference

**Project:** Magic Auth Dashboard  
**Version:** 2.0  
**Last Updated:** 2025-10-11  
**Status:** ✅ Complete

> 450+ functional CSS classes for rapid, consistent UI development with modern patterns and accessibility support.

---

## Quick Reference

| Category | Classes | Use Case |
|----------|---------|----------|
| [Display](#1-display-utilities) | 6 | Show/hide elements, flex, grid |
| [Flexbox](#2-flexbox-utilities) | 20+ | Flexible layouts |
| [Grid](#3-grid-utilities) | 4 | Column layouts |
| [Spacing](#gap-utilities) | 50+ | Margins, padding, gaps |
| [Typography](#8-text-utilities) | 30+ | Text styling |
| [Colors](#9-color-utilities) | 20+ | Text & backgrounds |
| [Layout](#10-border-utilities) | 40+ | Sizing, positioning |
| [Responsive](#responsive-utilities) | All | Mobile-first breakpoints |

---

## ⚠️ Size Naming Convention

**IMPORTANT:** All CSS classes and code use **short size names**:
- ✅ **Use in code:** `.rounded-sm`, `.rounded-md`, `.rounded-lg`, `.shadow-sm`, `.shadow-md`, `.shadow-lg`
- ✅ **Descriptive text:** "Small radius", "Medium shadow", "Large padding" (in comments/documentation)
- ❌ **Never in code:** `.rounded-small`, `.rounded-medium`, `.rounded-large`

See [UI/UX Guidelines - Size Naming Standard](./UI_UX_GUIDELINES.md#-size-naming-standard-mandatory) for complete details.

---

## Philosophy

### ✅ Use Utility Classes For

```tsx
// ✅ Good - Quick layouts and spacing
<div className="flex items-center justify-between p-6 gap-4">
  <h2 className="text-xl font-semibold">Dashboard</h2>
  <button className="btn btn-primary">Action</button>
</div>

// ✅ Good - Responsive adjustments
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Cards */}
</div>

// ✅ Good - One-off spacing tweaks
<section className="mt-8 mb-12">
  <p className="text-sm text-secondary">Helper text</p>
</section>
```

### ❌ Don't Use Utilities For

```tsx
// ❌ Bad - Repetitive patterns (create a component)
<div className="flex items-center justify-between p-4 border-b bg-white rounded-lg shadow">
  {/* This pattern repeats everywhere - make it a .card component */}
</div>

// ❌ Bad - Complex state management (use component CSS)
<button className={`
  px-4 py-2 rounded ${isPrimary ? 'bg-blue-500' : 'bg-gray-500'} 
  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}
`}>
  {/* Too complex - create .btn component with variants */}
</button>
```

### 🎯 Best Practices

1. **Combine with components** - Use utilities for spacing/layout, components for reusable patterns
2. **Mobile-first** - Start with base styles, add responsive modifiers
3. **Semantic grouping** - Group related classes logically
4. **Design tokens** - Utilities use design tokens internally

---

## Available Categories

### 1. Display Utilities

Control element display types:

```css
.flex              /* display: flex */
.inline-flex       /* display: inline-flex */
.grid              /* display: grid */
.block             /* display: block */
.inline-block      /* display: inline-block */
.hidden            /* display: none */
```

**Examples:**
```tsx
<div className="flex">Flex container</div>
<span className="inline-flex">Inline flex</span>
<div className="hidden">Not visible</div>
```

---

### 2. Flexbox Utilities

#### Direction & Wrap
```css
.flex-col          /* flex-direction: column */
.flex-row          /* flex-direction: row */
.flex-wrap         /* flex-wrap: wrap */
```

#### Alignment
```css
.items-center      /* align-items: center */
.items-start       /* align-items: flex-start */
.items-end         /* align-items: flex-end */
.items-stretch     /* align-items: stretch */
```

#### Justification
```css
.justify-center    /* justify-content: center */
.justify-start     /* justify-content: flex-start */
.justify-end       /* justify-content: flex-end */
.justify-between   /* justify-content: space-between */
```

#### Flex Item
```css
.flex-1            /* flex: 1 */
```

**Examples:**
```tsx
<div className="flex items-center justify-between">
  <span>Left</span>
  <span>Right</span>
</div>

<div className="flex flex-col items-start gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

### 3. Grid Utilities

```css
.grid-cols-1       /* 1 column grid */
.grid-cols-2       /* 2 column grid */
.grid-cols-3       /* 3 column grid */
.grid-cols-4       /* 4 column grid */
```

**Examples:**
```tsx
<div className="grid grid-cols-3 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

---

### 4. Gap Utilities

For flex and grid spacing:

```css
.gap-0-5    /* 0.125rem (2px) */
.gap-1      /* 0.25rem (4px) */
.gap-2      /* 0.5rem (8px) */
.gap-3      /* 0.75rem (12px) */
.gap-4      /* 1rem (16px) */
.gap-5      /* 1.25rem (20px) */
.gap-6      /* 1.5rem (24px) */
.gap-8      /* 2rem (32px) */
.gap-12     /* 3rem (48px) */
```

**Examples:**
```tsx
<div className="flex gap-4">
  <button>Button 1</button>
  <button>Button 2</button>
</div>
```

---

### 5. Margin Utilities

#### All Sides
```css
.m-0, .m-1, .m-2, .m-3, .m-4, .m-5, .m-6, .m-8
```

#### Individual Sides
```css
.mt-*    /* margin-top */
.mr-*    /* margin-right */
.mb-*    /* margin-bottom */
.ml-*    /* margin-left */
```

#### Auto Margin
```css
.mx-auto    /* Center horizontally */
```

**Examples:**
```tsx
<div className="mt-4 mb-6">Vertical margin</div>
<div className="mx-auto">Centered</div>
```

---

### 6. Padding Utilities

#### All Sides
```css
.p-0, .p-1, .p-2, .p-3, .p-4, .p-5, .p-6, .p-8, .p-10
```

#### Individual Sides
```css
.pt-*    /* padding-top */
.pr-*    /* padding-right */
.pb-*    /* padding-bottom */
.pl-*    /* padding-left */
```

**Examples:**
```tsx
<div className="p-4">Equal padding</div>
<div className="pt-6 pb-6">Vertical padding only</div>
```

---

### 7. Width & Height Utilities

#### Width
```css
.w-full          /* width: 100% */
.w-auto          /* width: auto */
.min-w-0         /* min-width: 0 */
.min-w-200       /* min-width: 200px */
.min-w-250       /* min-width: 250px */
.min-w-300       /* min-width: 300px */
.min-w-400       /* min-width: 400px */
.max-w-300       /* max-width: 300px */
.max-w-400       /* max-width: 400px */
.max-w-500       /* max-width: 500px */
```

#### Height
```css
.h-full          /* height: 100% */
.max-h-300       /* max-height: 300px */
.max-h-500       /* max-height: 500px */
```

**Examples:**
```tsx
<div className="w-full max-w-400">
  Limited width container
</div>
```

---

### 8. Text Utilities

#### Alignment
```css
.text-left       /* text-align: left */
.text-center     /* text-align: center */
.text-right      /* text-align: right */
```

#### Font Weight
```css
.font-normal     /* 400 */
.font-medium     /* 500 */
.font-semibold   /* 600 */
.font-bold       /* 700 */
```

#### Font Size
```css
.text-2xs        /* 0.625rem (10px) */
.text-xs         /* 0.75rem (12px) */
.text-sm         /* 0.875rem (14px) */
.text-base       /* 1rem (16px) */
.text-lg         /* 1.125rem (18px) */
.text-xl         /* 1.25rem (20px) */
.text-2xl        /* 1.5rem (24px) */
```

#### Font Family
```css
.font-mono       /* Monospace font */
```

**Examples:**
```tsx
<h1 className="text-2xl font-bold text-center">
  Centered Bold Heading
</h1>
<code className="font-mono text-sm">code snippet</code>
```

---

### 9. Color Utilities

#### Text Colors
```css
.text-primary      /* Primary text color */
.text-secondary    /* Secondary text color */
.text-tertiary     /* Tertiary text color */
.text-error        /* Error red */
.text-success      /* Success green */
.text-warning      /* Warning amber */
```

#### Background Colors
```css
.bg-white          /* White/surface */
.bg-gray-50        /* Light gray */
.bg-gray-100       /* Gray */
.bg-primary        /* Primary color */
.bg-primary-50     /* Light primary */
.bg-success        /* Success green */
.bg-error          /* Error red */
```

**Examples:**
```tsx
<div className="bg-primary text-white p-4">
  Primary background
</div>
<span className="text-error">Error message</span>
```

---

### 10. Border Utilities

#### Border Width
```css
.border            /* All sides */
.border-t          /* Top */
.border-r          /* Right */
.border-b          /* Bottom */
.border-l          /* Left */
```

#### Border Color
```css
.border-primary    /* Primary color */
.border-error      /* Error color */
.border-warning    /* Warning color */
```

#### Border Radius
```css
.rounded           /* Medium radius */
.rounded-sm        /* Small radius */
.rounded-lg        /* Large radius */
.rounded-full      /* Fully rounded (circle) */
```

**Examples:**
```tsx
<div className="border border-primary rounded-lg p-4">
  Bordered box
</div>
```

---

### 11. Shadow Utilities

```css
.shadow            /* Small shadow */
.shadow-md         /* Medium shadow */
.shadow-lg         /* Large shadow */
```

**Examples:**
```tsx
<div className="shadow-lg rounded-lg p-6">
  Elevated card
</div>
```

---

### 12. Position Utilities

```css
.relative          /* position: relative */
.absolute          /* position: absolute */
.fixed             /* position: fixed */
```

---

### 13. Overflow Utilities

```css
.overflow-hidden   /* overflow: hidden */
.overflow-auto     /* overflow: auto */
.overflow-y-auto   /* overflow-y: auto */
.overflow-x-auto   /* overflow-x: auto */
```

**Examples:**
```tsx
<div className="overflow-y-auto max-h-500">
  Scrollable content
</div>
```

---

### 14. Cursor Utilities

```css
.cursor-pointer       /* pointer */
.cursor-not-allowed   /* not-allowed */
```

---

### 15. Transition Utilities

```css
.transition           /* All properties transition */
.transition-colors    /* Color transitions only */
```

---

### 16. Z-Index Utilities

```css
.z-10     /* z-index: 10 */
.z-20     /* z-index: 20 */
.z-30     /* z-index: 30 */
.z-40     /* z-index: 40 */
.z-50     /* z-index: 50 */
```

---

### 17. Disabled State

```css
.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
```

**Examples:**
```tsx
<button className="btn disabled">
  Disabled Button
</button>
```

---

## Modern Layout Patterns

### Centered Modal/Dialog

```tsx
// Full-screen overlay with centered content
<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
  <div className="bg-white rounded-lg shadow-lg max-w-500 w-full p-6 m-4">
    <h2 className="text-xl font-semibold mb-4">Modal Title</h2>
    <p className="text-sm text-secondary mb-6">Modal content...</p>
    <div className="flex justify-end gap-2">
      <button className="btn btn-outline">Cancel</button>
      <button className="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

### Responsive Dashboard Layout

```tsx
// Sidebar + Main content layout
<div className="flex flex-col lg:flex-row min-h-screen">
  {/* Sidebar - full width on mobile, fixed width on desktop */}
  <aside className="w-full lg:w-64 bg-gray-900 p-4">
    <nav className="flex flex-col gap-2">
      <a href="#" className="text-white p-2 rounded hover:bg-gray-800">
        Dashboard
      </a>
      <a href="#" className="text-white p-2 rounded hover:bg-gray-800">
        Projects
      </a>
    </nav>
  </aside>
  
  {/* Main content - flexible width */}
  <main className="flex-1 p-6 bg-gray-50">
    <div className="max-w-1200 mx-auto">
      {/* Dashboard content */}
    </div>
  </main>
</div>
```

### Card Grid with Auto-fit

```tsx
// Responsive grid that auto-fits cards
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {items.map(item => (
    <article key={item.id} className="card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{item.title}</h3>
        <span className="badge badge-primary">{item.status}</span>
      </div>
      <p className="text-sm text-secondary mb-4">{item.description}</p>
      <button className="btn btn-outline btn-sm w-full">View Details</button>
    </article>
  ))}
</div>
```

### Sticky Header with Shadow on Scroll

```tsx
// Header that gains shadow on scroll
<header className="sticky top-0 bg-white border-b z-40">
  <div className="max-w-1400 mx-auto px-6 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-8">
        <h1 className="text-2xl font-bold">Brand</h1>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm font-medium hover:text-primary">Dashboard</a>
          <a href="#" className="text-sm font-medium hover:text-primary">Projects</a>
          <a href="#" className="text-sm font-medium hover:text-primary">Team</a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button className="btn btn-ghost btn-sm">
          <NotificationIcon size={20} />
        </button>
        <button className="btn btn-ghost btn-sm">
          <UserIcon size={20} />
        </button>
      </div>
    </div>
  </div>
</header>
```

### Two-Column Form Layout

```tsx
// Responsive form with two columns on larger screens
<form className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Full width field */}
  <div className="md:col-span-2">
    <label htmlFor="title" className="form-label">Project Title</label>
    <input id="title" type="text" className="form-input w-full" />
  </div>
  
  {/* Two columns on desktop */}
  <div>
    <label htmlFor="startDate" className="form-label">Start Date</label>
    <input id="startDate" type="date" className="form-input w-full" />
  </div>
  <div>
    <label htmlFor="endDate" className="form-label">End Date</label>
    <input id="endDate" type="date" className="form-input w-full" />
  </div>
  
  {/* Full width textarea */}
  <div className="md:col-span-2">
    <label htmlFor="description" className="form-label">Description</label>
    <textarea id="description" rows={4} className="form-textarea w-full" />
  </div>
  
  {/* Actions - right aligned */}
  <div className="md:col-span-2 flex justify-end gap-2">
    <button type="button" className="btn btn-outline">Cancel</button>
    <button type="submit" className="btn btn-primary">Create Project</button>
  </div>
</form>
```

### Empty State Pattern

```tsx
// Centered empty state with illustration
<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
    <SmileyIcon size={40} className="text-gray-400" />
  </div>
  <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
  <p className="text-sm text-secondary max-w-300 mb-6">
    Get started by creating your first project. Projects help you organize your work.
  </p>
  <button className="btn btn-primary">
    <PlusIcon size={16} />
    Create Project
  </button>
</div>
```

### Stats Dashboard Cards

```tsx
// Responsive stats grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {stats.map(stat => (
    <div key={stat.id} className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-secondary">{stat.label}</span>
        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
          <stat.icon size={20} className="text-primary" />
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{stat.value}</div>
      <div className="flex items-center gap-1 text-sm">
        <span className={stat.trend > 0 ? 'text-success' : 'text-error'}>
          {stat.trend > 0 ? '+' : ''}{stat.trend}%
        </span>
        <span className="text-secondary">vs last month</span>
      </div>
    </div>
  ))}
</div>
```

---

## Responsive Utilities

### Mobile (max-width: 640px)

```css
.sm\:hidden
.sm\:block
.sm\:flex
.sm\:grid
.sm\:grid-cols-1
.sm\:flex-col
.sm\:text-center
.sm\:gap-2
.sm\:gap-3
```

### Tablet (min-width: 768px)

```css
.md\:block
.md\:flex
.md\:grid
.md\:grid-cols-2
.md\:grid-cols-3
.md\:flex-row
.md\:gap-4
.md\:gap-6
```

### Desktop (min-width: 1024px)

```css
.lg\:block
.lg\:flex
.lg\:grid
.lg\:grid-cols-3
.lg\:grid-cols-4
.lg\:gap-6
.lg\:gap-8
```

**Examples:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Responsive grid */}
</div>

<div className="flex flex-col md:flex-row gap-4">
  {/* Stack on mobile, row on tablet+ */}
</div>
```

---

## Composition Examples

### Button Group

```tsx
<div className="flex gap-2 justify-end">
  <button className="btn btn-outline">Cancel</button>
  <button className="btn btn-primary">Save</button>
</div>
```

### Form Field

```tsx
<div className="flex flex-col gap-2">
  <label className="font-medium text-sm">Email</label>
  <input className="border rounded p-2" />
  <span className="text-xs text-error">Error message</span>
</div>
```

### Card with Header

```tsx
<div className="bg-white rounded-lg shadow overflow-hidden">
  <div className="border-b p-4 flex items-center justify-between">
    <h3 className="font-semibold">Card Title</h3>
    <button className="text-primary">Action</button>
  </div>
  <div className="p-6">
    Card content
  </div>
</div>
```

---

## Best Practices

### 1. Prefer Semantic Classes for Reusable Patterns

```tsx
// ❌ Avoid repetition
<div className="flex items-center justify-between p-4 border-b">...</div>
<div className="flex items-center justify-between p-4 border-b">...</div>

// ✅ Create a component class
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4);
  border-bottom: var(--border-divider);
}
```

### 2. Combine with Design Tokens

```tsx
// ✅ Good - uses design tokens through utilities
<div className="p-4 gap-4 rounded-lg">...</div>

// ❌ Avoid inline styles
<div style={{ padding: '16px', gap: '16px' }}>...</div>
```

### 3. Mobile-First Responsive Design

```tsx
// ✅ Good - mobile first, then enhance
<div className="flex-col md:flex-row">...</div>

// ❌ Avoid desktop first
<div className="flex-row sm:flex-col">...</div>
```

### 4. Readable Combinations

```tsx
// ✅ Good - grouped logically
<div className="flex items-center gap-4">
  <div className="w-full max-w-400">
    <div className="p-6 bg-white rounded-lg shadow">
      Content
    </div>
  </div>
</div>
```

---

## Performance Tips

1. **Tree shaking** - Unused utilities are automatically removed in production
2. **No runtime cost** - All utilities are static CSS
3. **Browser caching** - Utilities rarely change, cache-friendly
4. **Minimal specificity** - Single class selectors, easy to override

---

## Related Documentation

- Design tokens: `/docs/DESIGN_SYSTEM/tokens/`
- Layout patterns: `src/styles/components/layout-patterns.css`
- Component patterns: `/docs/DESIGN_SYSTEM/COMPONENT_INVENTORY.md`

---

**Maintained by:** Design System Team  
**Questions?** Create an issue in the project repository
