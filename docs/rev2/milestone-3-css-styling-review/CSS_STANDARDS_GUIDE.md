# CSS Standards Guide

## Overview

This guide establishes comprehensive CSS coding standards, conventions, and best practices for consistent, maintainable, and high-quality CSS development across the application.

## 📋 Table of Contents

1. [General Principles](#general-principles)
2. [Naming Conventions](#naming-conventions)
3. [Code Organization](#code-organization)
4. [CSS Property Order](#css-property-order)
5. [Design Token Usage](#design-token-usage)
6. [Responsive Design Standards](#responsive-design-standards)
7. [Accessibility Requirements](#accessibility-requirements)
8. [Performance Guidelines](#performance-guidelines)
9. [Quality Assurance](#quality-assurance)
10. [Code Examples](#code-examples)

## 🎯 General Principles

### 1. Consistency First
- Always follow established patterns and conventions
- Use design tokens instead of hardcoded values
- Maintain consistent naming across all CSS files
- Follow component-based architecture principles

### 2. Maintainability
- Write self-documenting CSS with clear structure
- Use meaningful class names that describe purpose, not appearance
- Keep specificity low and avoid !important declarations
- Organize code logically with clear sections and comments

### 3. Performance
- Minimize CSS bundle size through efficient patterns
- Use CSS custom properties for dynamic values
- Implement efficient selector patterns
- Optimize for CSS parsing and rendering performance

### 4. Accessibility
- Ensure all interactive elements have proper focus states
- Maintain sufficient color contrast ratios
- Support keyboard navigation and screen readers
- Implement responsive design for all device types

## 🏷️ Naming Conventions

### BEM Methodology

Use BEM (Block Element Modifier) naming convention for component CSS:

```css
/* Block - Component name */
.component-name {}

/* Element - Child element within component */
.component-name__element {}

/* Modifier - Variation of component or element */
.component-name--modifier {}
.component-name__element--modifier {}

/* State - Interactive state */
.component-name--active {}
.component-name--disabled {}
```

### Component Naming Standards

#### Block Naming
```css
/* ✅ Good - Descriptive, hyphenated */
.user-profile {}
.navigation-menu {}
.project-card {}
.data-table {}

/* ❌ Bad - Unclear, abbreviated */
.usr-prof {}
.nav {}
.card1 {}
.tbl {}
```

#### Element Naming
```css
/* ✅ Good - Clear hierarchy */
.user-profile__avatar {}
.user-profile__details {}
.user-profile__actions {}

.navigation-menu__item {}
.navigation-menu__link {}
.navigation-menu__icon {}

/* ❌ Bad - Unclear relationship */
.user-profile .avatar {}
.navigation-menu .item {}
```

#### Modifier Naming
```css
/* ✅ Good - Descriptive modifiers */
.button--primary {}
.button--secondary {}
.button--large {}
.button--disabled {}

.card--featured {}
.card--compact {}

/* ❌ Bad - Generic or unclear */
.button--blue {}
.button--big {}
.card--special {}
```

### Utility Class Naming

Use consistent utility class patterns:

```css
/* Layout utilities */
.flex { display: flex; }
.flex-center { display: flex; align-items: center; justify-content: center; }
.grid { display: grid; }
.block { display: block; }
.hidden { display: none; }

/* Spacing utilities */
.m-0 { margin: 0; }
.mt-4 { margin-top: var(--spacing-4); }
.p-4 { padding: var(--spacing-4); }
.gap-2 { gap: var(--spacing-2); }

/* Text utilities */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-primary { color: var(--color-text-primary); }
.text-muted { color: var(--color-text-muted); }

/* Size utilities */
.w-full { width: 100%; }
.h-full { height: 100%; }
.max-w-md { max-width: var(--max-width-md); }
```

## 📁 Code Organization

### File Structure Standards

```css
/* Component CSS File Structure */

/* ==========================================================================
   Component Name
   ========================================================================== */

/* Component tokens (if needed) */
:root {
  --component-padding: var(--spacing-4);
  --component-border-radius: var(--border-radius-md);
}

/* Base component styles */
.component-name {
  /* Layout properties */
  /* Visual properties */
  /* Typography properties */
  /* Interaction properties */
}

/* Component elements */
.component-name__element {
  /* Element styles */
}

/* Component modifiers */
.component-name--modifier {
  /* Modifier styles */
}

/* Component states */
.component-name--active,
.component-name--focus,
.component-name--hover {
  /* State styles */
}

/* Responsive variants */
@media (min-width: 768px) {
  .component-name {
    /* Tablet styles */
  }
}

@media (min-width: 1024px) {
  .component-name {
    /* Desktop styles */
  }
}
```

### Section Comments

Use consistent section comments for organization:

```css
/* ==========================================================================
   Main Section Title
   ========================================================================== */

/* --------------------------------------------------------------------------
   Sub-section Title
   -------------------------------------------------------------------------- */

/* Component or utility description */
.component-name {
  /* Property group comment */
  property: value;
}
```

## 🎨 CSS Property Order

Follow this property order for consistency:

```css
.component {
  /* 1. Display & Layout */
  display: flex;
  position: relative;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  
  /* 2. Flexbox/Grid */
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
  grid-template-columns: 1fr 1fr;
  
  /* 3. Box Model */
  width: 100%;
  max-width: var(--max-width-md);
  height: auto;
  margin: var(--spacing-4);
  padding: var(--spacing-6);
  
  /* 4. Visual */
  background-color: var(--color-background);
  border: var(--border-width-1) solid var(--color-border);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  opacity: 1;
  
  /* 5. Typography */
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  text-align: left;
  
  /* 6. Interaction */
  cursor: pointer;
  user-select: none;
  
  /* 7. Animation */
  transition: all 0.2s ease;
  transform: translateY(0);
}
```

## 🎨 Design Token Usage

### Token Hierarchy

Follow this hierarchy when choosing design tokens:

1. **Component-specific tokens** (highest priority)
2. **Semantic tokens** (context-specific)
3. **Base tokens** (primitive values)

```css
/* ✅ Preferred - Component-specific token */
.button {
  padding: var(--button-padding-y) var(--button-padding-x);
  border-radius: var(--button-border-radius);
}

/* ✅ Acceptable - Semantic token */
.error-message {
  color: var(--color-text-error);
  border-color: var(--color-border-error);
}

/* ⚠️ Use sparingly - Base token */
.custom-spacing {
  margin: var(--spacing-4);
}

/* ❌ Never - Hardcoded value */
.bad-example {
  margin: 16px;
  color: #ef4444;
}
```

### Creating New Tokens

When creating new design tokens, follow this pattern:

```css
/* Component-specific tokens */
:root {
  /* Naming pattern: --component-property-variant */
  --modal-padding: var(--spacing-8);
  --modal-border-radius: var(--border-radius-xl);
  --modal-max-width: var(--max-width-2xl);
  
  /* Semantic tokens */
  --color-background-modal: #ffffff;
  --color-backdrop-modal: rgba(0, 0, 0, 0.5);
}
```

## 📱 Responsive Design Standards

### Mobile-First Approach

Always write CSS mobile-first with progressive enhancement:

```css
/* ✅ Mobile-first approach */
.component {
  /* Base mobile styles (no media query) */
  padding: var(--spacing-4);
  font-size: var(--font-size-sm);
  grid-template-columns: 1fr;
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    padding: var(--spacing-6);
    font-size: var(--font-size-base);
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    padding: var(--spacing-8);
    font-size: var(--font-size-lg);
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ❌ Avoid desktop-first */
.component {
  padding: var(--spacing-8); /* Desktop styles first */
}

@media (max-width: 1024px) {
  .component {
    padding: var(--spacing-4); /* Mobile styles as override */
  }
}
```

### Breakpoint Usage

Use consistent breakpoint tokens:

```css
/* Standard breakpoints */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }

/* Use breakpoint tokens when available */
@media (min-width: var(--breakpoint-md)) {
  .component {
    /* Tablet styles */
  }
}
```

## ♿ Accessibility Requirements

### Focus Management

All interactive elements must have proper focus states:

```css
/* ✅ Proper focus management */
.interactive-element {
  /* Remove default outline */
  outline: 2px solid transparent;
  outline-offset: 2px;
  
  /* Transition for smooth focus */
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

/* Focus-visible for keyboard navigation */
.interactive-element:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
  box-shadow: var(--shadow-focus);
}

/* Hover states (optional) */
.interactive-element:hover {
  border-color: var(--color-border-focus);
}

/* ❌ Never remove focus without replacement */
.bad-example:focus {
  outline: none; /* Don't do this without alternative */
}
```

### Color Contrast

Ensure proper color contrast ratios:

```css
/* ✅ Good contrast examples */
.text-primary {
  color: var(--color-text-primary); /* #111827 - 16.8:1 contrast */
}

.text-secondary {
  color: var(--color-text-secondary); /* #4b5563 - 7.6:1 contrast */
}

.text-muted {
  color: var(--color-text-muted); /* #9ca3af - 4.5:1 contrast (minimum) */
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .component {
    border-width: var(--border-width-2);
    font-weight: var(--font-weight-semibold);
  }
}
```

### Motion Preferences

Respect user motion preferences:

```css
/* Default animations */
.animated-element {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.animated-element:hover {
  transform: translateY(-2px);
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    transition: none;
  }
  
  .animated-element:hover {
    transform: none;
  }
}
```

## ⚡ Performance Guidelines

### Efficient Selectors

Use efficient selector patterns:

```css
/* ✅ Efficient selectors */
.component { /* Single class */ }
.component__element { /* BEM element */ }
.component--modifier { /* BEM modifier */ }

/* ✅ Acceptable specificity */
.component .special-case { /* Specific targeting */ }

/* ❌ Avoid inefficient selectors */
div.component { /* Unnecessary tag qualifier */ }
.component div div span { /* Deep nesting */ }
.component * { /* Universal selector */ }
#component .element { /* ID selector in components */ }
```

### CSS Custom Properties

Use CSS custom properties efficiently:

```css
/* ✅ Good usage - Local scope */
.component {
  --local-color: var(--color-primary);
  --local-size: var(--spacing-4);
  
  color: var(--local-color);
  padding: var(--local-size);
}

/* ✅ Good usage - Dynamic theming */
.component {
  background-color: var(--component-bg, var(--color-background));
}

/* ❌ Avoid - Excessive nesting */
.component {
  --level1: var(--level2);
  --level2: var(--level3);
  --level3: var(--level4);
  color: var(--level1);
}
```

### Bundle Optimization

Keep CSS bundles optimized:

```css
/* ✅ Reusable patterns */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ❌ Avoid duplication */
.component-a {
  display: flex;
  align-items: center;
  justify-content: center;
}

.component-b {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

## 🔍 Quality Assurance

### CSS Linting Configuration

Use stylelint with these rules:

```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "class-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$",
    "custom-property-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$",
    "selector-max-compound-selectors": 3,
    "selector-max-specificity": "0,3,0",
    "declaration-no-important": true,
    "color-hex-length": "long",
    "color-named": "never"
  }
}
```

### Code Review Checklist

- [ ] **Design Tokens**: All hardcoded values replaced with tokens
- [ ] **Naming Convention**: BEM naming followed consistently
- [ ] **Property Order**: CSS properties ordered correctly
- [ ] **Responsive Design**: Mobile-first approach used
- [ ] **Accessibility**: Focus states and contrast ratios verified
- [ ] **Performance**: Efficient selectors and minimal specificity
- [ ] **Browser Support**: Cross-browser compatibility verified
- [ ] **Documentation**: Code is well-commented and self-documenting

### Testing Requirements

1. **Cross-Browser Testing**
   - Chrome/Chromium
   - Firefox
   - Safari
   - Edge

2. **Responsive Testing**
   - Mobile (320px-767px)
   - Tablet (768px-1023px)
   - Desktop (1024px+)

3. **Accessibility Testing**
   - Keyboard navigation
   - Screen reader compatibility
   - Color contrast verification
   - High contrast mode

## 📝 Code Examples

### Complete Component Example

```css
/* ==========================================================================
   User Profile Card Component
   ========================================================================== */

/* Component tokens */
:root {
  --user-profile-padding: var(--spacing-6);
  --user-profile-border-radius: var(--border-radius-lg);
  --user-profile-avatar-size: 4rem;
}

/* Base component */
.user-profile {
  /* Layout */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
  
  /* Box model */
  padding: var(--user-profile-padding);
  max-width: var(--max-width-sm);
  
  /* Visual */
  background-color: var(--color-background);
  border: var(--border-width-1) solid var(--color-border);
  border-radius: var(--user-profile-border-radius);
  box-shadow: var(--shadow-sm);
  
  /* Interaction */
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

/* Component elements */
.user-profile__avatar {
  width: var(--user-profile-avatar-size);
  height: var(--user-profile-avatar-size);
  border-radius: var(--border-radius-full);
  border: var(--border-width-2) solid var(--color-border);
  overflow: hidden;
}

.user-profile__name {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  text-align: center;
  margin: 0;
}

.user-profile__role {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-align: center;
  margin: 0;
}

.user-profile__actions {
  display: flex;
  gap: var(--spacing-3);
  margin-top: var(--spacing-2);
}

/* Component modifiers */
.user-profile--compact {
  padding: var(--spacing-4);
  flex-direction: row;
  text-align: left;
}

.user-profile--compact .user-profile__avatar {
  width: 3rem;
  height: 3rem;
}

/* Component states */
.user-profile--interactive {
  cursor: pointer;
}

.user-profile--interactive:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.user-profile--interactive:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

/* Responsive variants */
@media (min-width: 768px) {
  .user-profile {
    flex-direction: row;
    text-align: left;
  }
  
  .user-profile__avatar {
    width: 5rem;
    height: 5rem;
  }
}
```

### Utility Class Example

```css
/* ==========================================================================
   Layout Utilities
   ========================================================================== */

/* Flexbox utilities */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }

.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }

/* Grid utilities */
.grid { display: grid; }
.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }

/* Spacing utilities */
.gap-1 { gap: var(--spacing-1); }
.gap-2 { gap: var(--spacing-2); }
.gap-4 { gap: var(--spacing-4); }

/* Responsive grid utilities */
@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
}
```

---

*This CSS standards guide ensures consistent, maintainable, and high-quality CSS development across the entire application. Follow these standards for optimal code quality and team collaboration.* 