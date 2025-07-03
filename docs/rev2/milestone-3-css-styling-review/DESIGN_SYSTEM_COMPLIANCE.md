# Design System Compliance Guide

## Overview

This guide establishes the comprehensive design system standards and patterns for CSS implementation across the application. It defines token usage, component patterns, and consistency requirements to ensure a cohesive user experience.

## 🎨 Design Token System

### Color Tokens

#### Primary Color Palette
```css
/* Blue (Primary Brand) */
--color-blue-50: #eff6ff;
--color-blue-100: #dbeafe;
--color-blue-200: #bfdbfe;
--color-blue-300: #93c5fd;
--color-blue-400: #60a5fa;
--color-blue-500: #3b82f6;   /* Primary brand color */
--color-blue-600: #2563eb;
--color-blue-700: #1d4ed8;
--color-blue-800: #1e40af;
--color-blue-900: #1e3a8a;
```

#### Semantic Color System
```css
/* Semantic Colors - Use these for consistent meaning */
--color-primary: var(--color-blue-600);
--color-primary-hover: var(--color-blue-700);
--color-primary-light: var(--color-blue-100);

--color-success: var(--color-green-600);
--color-success-light: var(--color-green-100);

--color-error: var(--color-red-600);
--color-error-light: var(--color-red-100);

--color-warning: var(--color-yellow-600);
--color-warning-light: var(--color-yellow-100);

--color-info: var(--color-cyan-600);
--color-info-light: var(--color-cyan-100);
```

#### Neutral Color System
```css
/* Neutral Grays - Use for text, borders, backgrounds */
--color-gray-50: #f9fafb;    /* Background light */
--color-gray-100: #f3f4f6;   /* Background */
--color-gray-200: #e5e7eb;   /* Border subtle */
--color-gray-300: #d1d5db;   /* Border */
--color-gray-400: #9ca3af;   /* Text muted */
--color-gray-500: #6b7280;   /* Text secondary */
--color-gray-600: #4b5563;   /* Text primary */
--color-gray-700: #374151;   /* Text strong */
--color-gray-800: #1f2937;   /* Text emphasis */
--color-gray-900: #111827;   /* Text maximum */
```

#### Text Color Mapping
```css
/* Text Colors - Use semantic names */
--color-text-primary: var(--color-gray-900);
--color-text-secondary: var(--color-gray-600);
--color-text-muted: var(--color-gray-400);
--color-text-inverse: #ffffff;

/* Status Text Colors */
--color-text-success: var(--color-green-700);
--color-text-error: var(--color-red-700);
--color-text-warning: var(--color-yellow-700);
--color-text-info: var(--color-cyan-700);
```

### Spacing Token System

#### Base Spacing Scale
```css
/* Spacing Scale - Use for consistent spacing */
--spacing-0: 0;
--spacing-1: 0.25rem;    /* 4px */
--spacing-2: 0.5rem;     /* 8px */
--spacing-3: 0.75rem;    /* 12px */
--spacing-4: 1rem;       /* 16px */
--spacing-5: 1.25rem;    /* 20px */
--spacing-6: 1.5rem;     /* 24px */
--spacing-8: 2rem;       /* 32px */
--spacing-10: 2.5rem;    /* 40px */
--spacing-12: 3rem;      /* 48px */
--spacing-16: 4rem;      /* 64px */
--spacing-20: 5rem;      /* 80px */
--spacing-24: 6rem;      /* 96px */
```

#### Component Spacing Tokens
```css
/* Component-specific spacing */
--spacing-input-padding: var(--spacing-3);
--spacing-button-padding-x: var(--spacing-4);
--spacing-button-padding-y: var(--spacing-2);
--spacing-card-padding: var(--spacing-6);
--spacing-modal-padding: var(--spacing-8);
--spacing-section-margin: var(--spacing-10);
```

### Typography Token System

#### Font Family Tokens
```css
/* Font Families */
--font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-family-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

#### Font Size Scale
```css
/* Typography Scale */
--font-size-xs: 0.75rem;     /* 12px */
--font-size-sm: 0.875rem;    /* 14px */
--font-size-base: 1rem;      /* 16px */
--font-size-lg: 1.125rem;    /* 18px */
--font-size-xl: 1.25rem;     /* 20px */
--font-size-2xl: 1.5rem;     /* 24px */
--font-size-3xl: 1.875rem;   /* 30px */
--font-size-4xl: 2.25rem;    /* 36px */
```

#### Font Weight Tokens
```css
/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

#### Line Height Tokens
```css
/* Line Heights */
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### Sizing Token System

#### Width Tokens
```css
/* Width Tokens */
--width-xs: 20rem;      /* 320px */
--width-sm: 24rem;      /* 384px */
--width-md: 28rem;      /* 448px */
--width-lg: 32rem;      /* 512px */
--width-xl: 36rem;      /* 576px */
--width-2xl: 42rem;     /* 672px */
--width-3xl: 48rem;     /* 768px */
--width-4xl: 56rem;     /* 896px */
--width-5xl: 64rem;     /* 1024px */
--width-6xl: 72rem;     /* 1152px */
--width-7xl: 80rem;     /* 1280px */

/* Max Width Tokens */
--max-width-xs: var(--width-xs);
--max-width-sm: var(--width-sm);
--max-width-md: var(--width-md);
--max-width-lg: var(--width-lg);
--max-width-xl: var(--width-xl);
--max-width-2xl: var(--width-2xl);
--max-width-3xl: var(--width-3xl);
--max-width-4xl: var(--width-4xl);
--max-width-5xl: var(--width-5xl);
--max-width-6xl: var(--width-6xl);
--max-width-7xl: var(--width-7xl);

/* Component-specific widths */
--max-width-form: var(--width-lg);
--max-width-modal: var(--width-2xl);
--max-width-card: var(--width-md);
--max-width-content: var(--width-4xl);
```

#### Height Tokens
```css
/* Height Tokens */
--height-xs: 1.5rem;     /* 24px */
--height-sm: 2rem;       /* 32px */
--height-md: 2.5rem;     /* 40px */
--height-lg: 3rem;       /* 48px */
--height-xl: 3.5rem;     /* 56px */

/* Min/Max Height Tokens */
--min-height-input: var(--height-md);
--min-height-input-lg: var(--height-lg);
--min-height-button: var(--height-md);
--max-height-dropdown: 12rem;    /* 192px */
--max-height-content: 20rem;     /* 320px */
--max-height-modal: 80vh;
```

### Border Token System

#### Border Width Tokens
```css
/* Border Widths */
--border-width-0: 0;
--border-width-1: 1px;
--border-width-2: 2px;
--border-width-4: 4px;
```

#### Border Radius Tokens
```css
/* Border Radius */
--border-radius-none: 0;
--border-radius-sm: 0.125rem;    /* 2px */
--border-radius-md: 0.25rem;     /* 4px */
--border-radius-lg: 0.375rem;    /* 6px */
--border-radius-xl: 0.5rem;      /* 8px */
--border-radius-2xl: 0.75rem;    /* 12px */
--border-radius-3xl: 1rem;       /* 16px */
--border-radius-full: 9999px;
```

#### Border Color Tokens
```css
/* Border Colors */
--color-border: var(--color-gray-200);
--color-border-strong: var(--color-gray-300);
--color-border-subtle: var(--color-gray-100);
--color-border-focus: var(--color-primary);
--color-border-error: var(--color-error);
--color-border-success: var(--color-success);
```

### Shadow Token System

#### Box Shadow Tokens
```css
/* Shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Focus Shadows */
--shadow-focus: 0 0 0 3px var(--color-focus-ring-primary);
--shadow-focus-error: 0 0 0 3px var(--color-focus-ring-error);
--shadow-focus-success: 0 0 0 3px var(--color-focus-ring-success);
```

#### Focus Ring Tokens
```css
/* Focus Ring Colors */
--color-focus-ring-primary: rgba(59, 130, 246, 0.1);
--color-focus-ring-error: rgba(239, 68, 68, 0.1);
--color-focus-ring-success: rgba(34, 197, 94, 0.1);
--color-focus-ring-warning: rgba(245, 158, 11, 0.1);
```

## 🏗️ Component Patterns

### Button Component Pattern

#### Button Token System
```css
/* Button-specific tokens */
--button-padding-x-sm: var(--spacing-3);
--button-padding-y-sm: var(--spacing-1);
--button-padding-x-md: var(--spacing-4);
--button-padding-y-md: var(--spacing-2);
--button-padding-x-lg: var(--spacing-6);
--button-padding-y-lg: var(--spacing-3);

--button-border-radius: var(--border-radius-md);
--button-font-weight: var(--font-weight-medium);
--button-min-height: var(--min-height-button);
```

#### Button Variants
```css
/* Primary Button */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  border: var(--border-width-1) solid var(--color-primary);
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}

.btn-primary:focus-visible {
  box-shadow: var(--shadow-focus);
}

/* Secondary Button */
.btn-secondary {
  background-color: transparent;
  color: var(--color-primary);
  border: var(--border-width-1) solid var(--color-border);
}

/* Button Sizes */
.btn-sm {
  padding: var(--button-padding-y-sm) var(--button-padding-x-sm);
  font-size: var(--font-size-sm);
}

.btn-md {
  padding: var(--button-padding-y-md) var(--button-padding-x-md);
  font-size: var(--font-size-base);
}

.btn-lg {
  padding: var(--button-padding-y-lg) var(--button-padding-x-lg);
  font-size: var(--font-size-lg);
}
```

### Form Component Pattern

#### Form Token System
```css
/* Form-specific tokens */
--form-input-padding: var(--spacing-3);
--form-input-border-radius: var(--border-radius-md);
--form-input-border-width: var(--border-width-1);
--form-input-min-height: var(--min-height-input);

--form-label-font-weight: var(--font-weight-medium);
--form-label-color: var(--color-text-primary);
--form-help-text-color: var(--color-text-muted);
--form-error-color: var(--color-text-error);
```

#### Form Component Structure
```css
/* Form Group */
.form-group {
  margin-bottom: var(--spacing-4);
}

/* Form Label */
.form-label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: var(--form-label-font-weight);
  color: var(--form-label-color);
  font-size: var(--font-size-sm);
}

/* Form Input */
.form-input {
  width: 100%;
  padding: var(--form-input-padding);
  border: var(--form-input-border-width) solid var(--color-border);
  border-radius: var(--form-input-border-radius);
  min-height: var(--form-input-min-height);
  font-size: var(--font-size-base);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-focus);
}

.form-input--error {
  border-color: var(--color-border-error);
}

.form-input--error:focus {
  box-shadow: var(--shadow-focus-error);
}

/* Form Help Text */
.form-help-text {
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--form-help-text-color);
}

/* Form Error Text */
.form-error-text {
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--form-error-color);
}
```

### Card Component Pattern

#### Card Token System
```css
/* Card-specific tokens */
--card-padding: var(--spacing-6);
--card-border-radius: var(--border-radius-lg);
--card-border-width: var(--border-width-1);
--card-background: #ffffff;
--card-shadow: var(--shadow-sm);
```

#### Card Component Structure
```css
.card {
  background-color: var(--card-background);
  border: var(--card-border-width) solid var(--color-border);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.card__header {
  padding: var(--card-padding);
  border-bottom: var(--border-width-1) solid var(--color-border);
}

.card__content {
  padding: var(--card-padding);
}

.card__footer {
  padding: var(--card-padding);
  border-top: var(--border-width-1) solid var(--color-border);
  background-color: var(--color-gray-50);
}
```

### Modal Component Pattern

#### Modal Token System
```css
/* Modal-specific tokens */
--modal-padding: var(--spacing-8);
--modal-border-radius: var(--border-radius-xl);
--modal-background: #ffffff;
--modal-backdrop-color: var(--color-modal-backdrop);
--modal-max-width: var(--max-width-modal);
--modal-max-height: var(--max-height-modal);
```

#### Modal Component Structure
```css
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--modal-backdrop-color);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal);
}

.modal {
  background-color: var(--modal-background);
  border-radius: var(--modal-border-radius);
  max-width: var(--modal-max-width);
  max-height: var(--modal-max-height);
  margin: var(--spacing-4);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.modal__header {
  padding: var(--modal-padding);
  border-bottom: var(--border-width-1) solid var(--color-border);
}

.modal__content {
  padding: var(--modal-padding);
  overflow-y: auto;
}

.modal__footer {
  padding: var(--modal-padding);
  border-top: var(--border-width-1) solid var(--color-border);
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
}
```

## 📱 Responsive Design Standards

### Breakpoint System
```css
/* Breakpoint Tokens */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Mobile-First Media Queries
```css
/* Mobile First Approach - Always start with mobile styles */

/* Mobile (default) - No media query needed */
.component {
  padding: var(--spacing-4);
  font-size: var(--font-size-sm);
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    padding: var(--spacing-6);
    font-size: var(--font-size-base);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    padding: var(--spacing-8);
    font-size: var(--font-size-lg);
  }
}
```

### Responsive Utility Patterns
```css
/* Responsive Grid */
.grid-responsive {
  display: grid;
  gap: var(--spacing-4);
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-6);
  }
}

@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-8);
  }
}
```

## ♿ Accessibility Standards

### Focus Management
```css
/* Focus Styles - Always include focus-visible styles */
.interactive-element {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.interactive-element:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
  .component {
    border-width: var(--border-width-2);
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
    transition: none;
  }
}
```

### Color Contrast Requirements
```css
/* Ensure 4.5:1 contrast ratio for normal text */
/* Ensure 3:1 contrast ratio for large text (18px+ or 14px+ bold) */

/* Good contrast examples */
.text-primary { color: var(--color-text-primary); }    /* #111827 on white - 16.8:1 */
.text-secondary { color: var(--color-text-secondary); }  /* #4b5563 on white - 7.6:1 */
.text-muted { color: var(--color-text-muted); }        /* #9ca3af on white - 4.5:1 */
```

## 🎯 Implementation Guidelines

### Design Token Usage Rules

1. **Always use design tokens instead of hardcoded values**
   ```css
   /* ❌ Don't do this */
   .component {
     margin: 16px;
     color: #3b82f6;
     border-radius: 8px;
   }
   
   /* ✅ Do this */
   .component {
     margin: var(--spacing-4);
     color: var(--color-primary);
     border-radius: var(--border-radius-xl);
   }
   ```

2. **Use semantic color tokens for meaningful associations**
   ```css
   /* ❌ Don't use primitive tokens directly */
   .error-message { color: var(--color-red-600); }
   
   /* ✅ Use semantic tokens */
   .error-message { color: var(--color-text-error); }
   ```

3. **Follow component token hierarchy**
   ```css
   /* ✅ Component-specific tokens first */
   .button {
     padding: var(--button-padding-y) var(--button-padding-x);
     border-radius: var(--button-border-radius);
     min-height: var(--button-min-height);
   }
   ```

### Naming Convention Standards

1. **Use BEM naming for component classes**
   ```css
   .component-name { /* Block */ }
   .component-name__element { /* Element */ }
   .component-name--modifier { /* Modifier */ }
   .component-name--state { /* State */ }
   ```

2. **Use utility classes for common patterns**
   ```css
   .text-center { text-align: center; }
   .flex-center { display: flex; align-items: center; justify-content: center; }
   .sr-only { /* Screen reader only */ }
   ```

3. **Avoid mixing patterns in the same context**
   ```tsx
   {/* ❌ Don't mix component and utility classes */}
   <div className="modal-content text-center flex items-center">
   
   {/* ✅ Be consistent with the pattern */}
   <div className="modal__content text-center flex-center">
   ```

### Quality Assurance Checklist

- [ ] All hardcoded values replaced with design tokens
- [ ] Consistent naming convention applied
- [ ] Focus states implemented for interactive elements
- [ ] Color contrast ratios verified
- [ ] Responsive behavior tested across breakpoints
- [ ] Accessibility features verified
- [ ] Design token usage follows semantic hierarchy
- [ ] Component patterns follow established conventions

---

*This design system compliance guide ensures consistent, accessible, and maintainable CSS across the entire application while providing clear standards for all development work.* 