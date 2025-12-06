# Size Specifications Reference

**Quick reference guide for exact pixel values across all components**

---

## Complete Size Matrix

### Buttons
```tsx
<Button size="xs" />  // 28px height, 8px × 12px padding, 12px icon
<Button size="sm" />  // 32px height, 8px × 16px padding, 16px icon
<Button size="md" />  // 40px height, 12px × 20px padding, 16px icon ⭐ DEFAULT
<Button size="lg" />  // 48px height, 16px × 24px padding, 20px icon
```

### Icons
```tsx
<Icon size={12} />  // xs - Inline text indicators
<Icon size={16} />  // sm - Buttons, compact UI
<Icon size={20} />  // md - Navigation, standard ⭐ DEFAULT
<Icon size={24} />  // lg - Headers, prominent
<Icon size={32} />  // xl - Hero sections
```

### Modals
```tsx
<Modal size="sm" />  // 400px width - Confirmations
<Modal size="md" />  // 600px width - Standard forms ⭐ DEFAULT
<Modal size="lg" />  // 800px width - Complex forms
<Modal size="xl" />  // 1000px width - Full features
```

### Cards
```tsx
<Card padding="sm" />  // 16px padding - Compact
<Card padding="md" />  // 24px padding - Standard ⭐ DEFAULT
<Card padding="lg" />  // 32px padding - Spacious
```

### Badges
```tsx
<Badge size="sm" />  // 20px height, 12px font, 4px × 8px padding
<Badge size="md" />  // 24px height, 14px font, 6px × 12px padding ⭐ DEFAULT
<Badge size="lg" />  // 28px height, 16px font, 8px × 16px padding
```

### Typography
```css
.text-2xs   /* 10px - Minimal labels */
.text-xs    /* 12px - Labels, timestamps */
.text-sm    /* 14px - Secondary text */
.text-base  /* 16px - Body text ⭐ DEFAULT */
.text-lg    /* 18px - Subsection headings */
.text-xl    /* 20px - Section headings */
.text-2xl   /* 24px - Page titles */
.text-3xl   /* 30px - Hero titles */
```

### Border Radius
```css
.rounded-sm    /* 4px - Badges, tags */
.rounded-md    /* 8px - Buttons, inputs ⭐ DEFAULT */
.rounded-lg    /* 12px - Cards, modals */
.rounded-full  /* 9999px - Avatars, pills */
```

### Shadows
```css
.shadow-sm  /* Low elevation - Default cards */
.shadow-md  /* Medium elevation - Hover, dropdowns */
.shadow-lg  /* High elevation - Popovers */
.shadow-xl  /* Highest elevation - Modals */
```

### Spacing (8px Grid)
```css
.gap-1   /*  4px - Minimal spacing */
.gap-2   /*  8px - Icon + text, tight */
.gap-3   /* 12px - Compact spacing */
.gap-4   /* 16px - Standard spacing ⭐ DEFAULT */
.gap-6   /* 24px - Comfortable spacing */
.gap-8   /* 32px - Loose spacing */
.gap-12  /* 48px - Section breaks */
```

---

## Decision Matrix

### Which size should I use?

#### For Buttons:
- **xs (28px)** - Dense data tables, inline tag actions
- **sm (32px)** - Table row actions, compact forms
- **md (40px)** - Standard buttons, most use cases ⭐
- **lg (48px)** - Hero CTAs, primary page actions

#### For Icons:
- **12px** - Inside xs badges, minimal indicators
- **16px** - Inside buttons, table cells, compact UI ⭐
- **20px** - Navigation, standard standalone icons
- **24px** - Page headers, prominent actions
- **32px** - Hero sections, branding

#### For Modals:
- **sm (400px)** - "Are you sure?" confirmations, quick forms
- **md (600px)** - Standard forms with 3-5 fields ⭐
- **lg (800px)** - Complex forms with 6+ fields, multiple sections
- **xl (1000px)** - Feature-rich modals, wizards

#### For Cards:
- **sm (16px)** - Dashboard cards, list items
- **md (24px)** - Standard content cards ⭐
- **lg (32px)** - Featured content, spotlight sections

---

## Real-World Examples

### Dashboard Stats Card
```tsx
<Card padding="md" className="shadow-sm rounded-lg">
  <div className="flex items-center gap-4">
    <div className="bg-primary-50 rounded-lg p-3">
      <UserIcon size={24} />
    </div>
    <div>
      <p className="text-sm text-secondary">Total Users</p>
      <h3 className="text-2xl font-bold">1,234</h3>
    </div>
  </div>
</Card>
```

### Action Button Group
```tsx
<div className="flex gap-2">
  <Button size="sm" variant="outline">
    <ExportIcon size={16} />
    Export
  </Button>
  <Button size="md" variant="primary">
    <PlusIcon size={16} />
    Add User
  </Button>
</div>
```

### Table Actions
```tsx
<td className="table-cell">
  <div className="flex gap-1">
    <Button size="xs" variant="ghost" aria-label="Edit">
      <EditIcon size={12} />
    </Button>
    <Button size="xs" variant="ghost" aria-label="Delete">
      <DeleteIcon size={12} />
    </Button>
  </div>
</td>
```

### Form Modal
```tsx
<Modal size="md">
  <Modal.Header>
    <h2 className="text-xl font-semibold">Create Project</h2>
  </Modal.Header>
  <Modal.Content className="space-y-4">
    <Input label="Project Name" />
    <Textarea label="Description" rows={4} />
  </Modal.Content>
  <Modal.Footer>
    <Button size="md" variant="outline">Cancel</Button>
    <Button size="md" variant="primary">Create</Button>
  </Modal.Footer>
</Modal>
```

---

## Quick Lookup

**Need a button for table actions?**  
→ `<Button size="sm">` (32px)

**Need an icon inside a button?**  
→ `size={16}` for most buttons

**Need a confirmation dialog?**  
→ `<Modal size="sm">` (400px)

**Need a standard form modal?**  
→ `<Modal size="md">` (600px)

**Need card spacing?**  
→ `padding="md"` (24px)

**Need rounded corners?**  
→ `rounded-md` (8px) for most elements

**Need gap between elements?**  
→ `gap-4` (16px) for standard spacing

---

## Measurement Guidelines

### Visual Rhythm (8px Grid)
All spacing follows an 8px grid system:
- 4px (0.5 unit)
- 8px (1 unit) ⭐ base unit
- 12px (1.5 units)
- 16px (2 units)
- 24px (3 units)
- 32px (4 units)
- 48px (6 units)

### Touch Targets
Minimum interactive element size: **44 × 44px** (WCAG AAA)
- Buttons: Minimum 32px height (sm)
- Icons: Clickable area should be at least 44px
- Links: Minimum 44px tap target with padding

### Typography Scale
Base font size: **16px** (1rem)
- Scale ratio: ~1.25 (major third)
- Line height: 1.5 for body, 1.2 for headings
- Letter spacing: Default for most, tighter for large headings

---

## FAQ

**Q: Can I use custom pixel values?**  
A: No, always use the defined size scale for consistency.

**Q: What if none of these sizes fit?**  
A: Choose the closest standard size. If truly needed, discuss with design team.

**Q: Why don't all components have xs/xl?**  
A: Not all components need extreme sizes. We only include commonly used sizes.

**Q: Can I mix size systems (e.g., size="16" for buttons)?**  
A: No. Buttons use string sizes (sm/md/lg), icons use numeric pixels.

---

**Last Updated:** October 12, 2025  
**Version:** 2.4  
**See also:** [SIZE_NAMING_STANDARD.md](./SIZE_NAMING_STANDARD.md) for naming conventions
