# 📏 Size Naming Standard - Quick Reference

**Version:** 2.4  
**Date:** October 12, 2025  
**Status:** ✅ Mandatory Standard

---

## 🎯 The Rule

**ALWAYS use short size names. NEVER use long descriptive names.**

### ✅ Correct (Short Form)
```tsx
// Component Props
<Button size="sm">Save</Button>
<Button size="md">Submit</Button>
<Button size="lg">Get Started</Button>

<Modal size="sm" />
<Modal size="md" />
<Modal size="lg" />

<Badge size="sm" />
<Card padding="md" />

// CSS Classes
.btn-sm
.btn-md
.btn-lg

.modal-sm
.modal-md
.modal-lg

.shadow-sm
.shadow-md
.shadow-lg

.rounded-sm
.rounded-md
.rounded-lg

// TypeScript Interfaces
interface ButtonProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

interface IconProps {
  size?: number; // Use numeric values for icons (16, 20, 24, etc.)
}
```

### ❌ Wrong (Long Form - NEVER USE)
```tsx
// ❌ WRONG - Do not use
<Button size="small">Save</Button>
<Button size="medium">Submit</Button>
<Button size="large">Get Started</Button>

// ❌ WRONG - Do not use
.btn-small
.btn-medium
.btn-large

// ❌ WRONG - Do not use
interface ButtonProps {
  size?: 'small' | 'medium' | 'large';
}
```

---

## 📐 Standard Size Scale by Component

### Button Heights
| Size | Height | Padding | Use Case |
|------|--------|---------|----------|
| `xs` | 28px | 8px × 12px | Dense tables, inline actions |
| `sm` | 32px | 8px × 16px | Table actions, compact UI |
| `md` | 40px | 12px × 20px | **Default** - Most buttons |
| `lg` | 48px | 16px × 24px | Primary CTAs, hero sections |

### Icon Sizes
| Size | Pixels | Use Case |
|------|--------|----------|
| `xs` | 12px | Inline text indicators, tiny badges |
| `sm` | 16px | Buttons, compact UI, table icons |
| `md` | 20px | **Default** - Navigation, standard icons |
| `lg` | 24px | Headers, prominent actions |
| `xl` | 32px | Hero sections, large displays |

### Modal Widths
| Size | Width | Use Case |
|------|-------|----------|
| `sm` | 400px | Confirmations, 1-2 fields |
| `md` | 600px | **Default** - Standard forms (3-5 fields) |
| `lg` | 800px | Complex forms (6+ fields) |
| `xl` | 1000px | Full feature modals |

### Card Padding
| Size | Padding | Use Case |
|------|---------|----------|
| `sm` | 16px | Compact cards, tight layouts |
| `md` | 24px | **Default** - Standard cards |
| `lg` | 32px | Spacious cards, featured content |

### Badge Sizes
| Size | Height | Font Size | Padding |
|------|--------|-----------|----------|
| `sm` | 20px | 12px | 4px × 8px |
| `md` | 24px | 14px | 6px × 12px |
| `lg` | 28px | 16px | 8px × 16px |

### Border Radius
| Size | Radius | Use Case |
|------|--------|----------|
| `sm` | 4px | Badges, tags, pills |
| `md` | 8px | **Default** - Buttons, inputs |
| `lg` | 12px | Cards, modals, large containers |
| `full` | 9999px | Circular elements, avatars |

### Shadows
| Size | Elevation | Use Case |
|------|-----------|----------|
| `sm` | Low | Cards (default state) |
| `md` | Medium | Cards (hover), dropdowns |
| `lg` | High | Popovers, floating menus |
| `xl` | Highest | Modals, dialogs |

### Typography
| Size | Pixels | Use Case |
|------|--------|----------|
| `2xs` | 10px | Minimal labels only |
| `xs` | 12px | Labels, timestamps, captions |
| `sm` | 14px | Secondary text, table content |
| `base` | 16px | **Default** - Body text |
| `lg` | 18px | Subsection headings |
| `xl` | 20px | Section headings |
| `2xl` | 24px | Page titles |
| `3xl` | 30px | Hero titles |

---

## 🎯 Where This Applies

### ✅ Use Short Names In:
1. **Component Props** - `<Button size="sm">`
2. **CSS Classes** - `.btn-sm`, `.shadow-md`, `.rounded-lg`
3. **TypeScript Interfaces** - `size?: 'xs' | 'sm' | 'md' | 'lg'`
4. **Code Examples** - All documentation examples
5. **Variable Names** - `const buttonSize = 'md'`

### ✅ Descriptive Text is OK:
- Comments: `/* Small padding for compact layout */`
- Documentation: "Use small buttons for table actions"
- UI Labels: "Select size: Small, Medium, Large"

---

## 🔍 Component-Specific Rules

### Buttons
```tsx
// ✅ Correct
<Button size="xs">Tiny</Button>      // 28px height
<Button size="sm">Small</Button>     // 32px height
<Button size="md">Default</Button>   // 40px height (default)
<Button size="lg">Large</Button>     // 48px height

// ❌ Wrong
<Button size="small">Small</Button>
<Button size="medium">Default</Button>
```

### Icons
```tsx
// ✅ Correct - Use numeric sizes
<UserIcon size={12} />  // xs
<UserIcon size={16} />  // sm
<UserIcon size={20} />  // md (default)
<UserIcon size={24} />  // lg
<UserIcon size={32} />  // xl

// ❌ Wrong - Don't use string sizes
<UserIcon size="small" />
<UserIcon size="medium" />
<UserIcon size="sm" />  // Icons use numbers, not strings
```

### Modals
```tsx
// ✅ Correct
<Modal size="sm" />  // 400px width
<Modal size="md" />  // 600px width (default)
<Modal size="lg" />  // 800px width
<Modal size="xl" />  // 1000px width

// ❌ Wrong
<Modal size="small" />
<Modal size="medium" />
<Modal size={600} />  // Modals use strings, not numbers
```

### Cards
```tsx
// ✅ Correct
<Card padding="sm" />  // 16px padding
<Card padding="md" />  // 24px padding (default)
<Card padding="lg" />  // 32px padding

// ❌ Wrong
<Card padding="small" />
<Card padding="medium" />
<Card padding={24} />  // Cards use strings, not numbers
```

### Badges
```tsx
// ✅ Correct
<Badge size="sm">New</Badge>       // 20px height, 12px font
<Badge size="md">Active</Badge>    // 24px height, 14px font (default)
<Badge size="lg">Featured</Badge>  // 28px height, 16px font

// ❌ Wrong
<Badge size="small">New</Badge>
<Badge size="medium">Active</Badge>
```

---

## 🔄 Migration Guide

### Find and Replace (Codebase)

#### Component Props
```bash
# Button sizes
Find:    size="small"
Replace: size="sm"

Find:    size="medium"
Replace: size="md"

Find:    size="large"
Replace: size="lg"
```

#### CSS Classes
```bash
# Button classes
Find:    .btn-small
Replace: .btn-sm

Find:    .btn-medium
Replace: .btn-md

Find:    .btn-large
Replace: .btn-lg

# Modal classes
Find:    .modal-small
Replace: .modal-sm

# Card classes
Find:    .card-padding-small
Replace: .card-padding-sm
```

#### TypeScript Interfaces
```typescript
// Before
interface Props {
  size?: 'small' | 'medium' | 'large';
}

// After
interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}
```

### Icon Sizes - Special Case
Icons should use **numeric sizes** directly:

```tsx
// ✅ Correct
<EditIcon size={16} />
<UserIcon size={20} />
<LogoIcon size={32} />

// ❌ Wrong
<EditIcon size="sm" />
<UserIcon size="medium" />
```

---

## 📚 Updated Documentation

The following design system documentation files have been updated:

1. **UI_UX_GUIDELINES.md** - Added mandatory "Size Naming Standard" section
2. **COMPONENT_INVENTORY.md** - Added prominent notice about size naming
3. **UTILITY_CLASSES.md** - Added clarification section
4. **ICON_SYSTEM.md** - Updated all interfaces to use numeric sizes
5. **README.md** - Updated CSS naming examples
6. **CHANGELOG.md** - Documented v2.4 standardization

---

## ❓ FAQ

### Q: Why short names only?
**A:** Consistency, brevity, and industry standards (TailwindCSS, Bootstrap, Material-UI all use short names).

### Q: What about existing code with long names?
**A:** Legacy CSS classes may exist for backward compatibility but are deprecated. Update to short names.

### Q: Can I use long names in comments?
**A:** Yes! Comments and descriptive text can use "small", "medium", "large" for readability. Only code must use short names.

### Q: What about icon sizes?
**A:** Icons use **numeric sizes** (16, 20, 24) directly, not string sizes.

### Q: Are there exceptions?
**A:** No. This is a mandatory standard across the entire design system.

---

## ✅ Checklist for New Components

When creating a new component with size variations:

- [ ] Use short names in TypeScript interface: `size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'`
- [ ] Use short names in CSS classes: `.component-sm`, `.component-md`, `.component-lg`
- [ ] Set `md` as default size: `size = 'md'`
- [ ] Document size options using short names
- [ ] Add examples using short names
- [ ] Never use long names (`small`, `medium`, `large`) in code

---

## 📞 Questions?

See full documentation: [UI/UX Guidelines - Size Naming Standard](./UI_UX_GUIDELINES.md#-size-naming-standard-mandatory)

---

**Maintained by:** Design System Team  
**Effective Date:** October 12, 2025  
**Version:** 2.4
