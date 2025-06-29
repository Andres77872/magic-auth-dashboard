# Milestone 1.1: Project Setup & Dependencies

## Overview
**Duration**: Day 1-2  
**Goal**: Configure the development environment with minimal dependencies and modern tooling

## 📋 Tasks Checklist

### Step 1: Install Dependencies
- [ ] Install React Router for routing
- [ ] Install TypeScript ESLint tools
- [ ] Install Prettier for code formatting
- [ ] Verify existing dependencies

### Step 2: Configure TypeScript
- [ ] Enable strict mode in tsconfig.json
- [ ] Configure path mapping for imports
- [ ] Set up proper type checking

### Step 3: Set up Code Quality Tools
- [ ] Configure ESLint with TypeScript rules
- [ ] Set up Prettier configuration
- [ ] Add scripts for linting and formatting

### Step 4: Create CSS Design System
- [ ] Set up CSS custom properties
- [ ] Create component styling structure
- [ ] Add responsive design utilities

### Step 5: Environment Configuration
- [ ] Set up environment variables
- [ ] Configure API base URL
- [ ] Add development vs production configs

---

## 🔧 Detailed Implementation Steps

### Step 1: Install Dependencies

```bash
# Install React Router (only additional runtime dependency)
npm install react-router-dom

# Install development dependencies for code quality
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier

# Verify installation
npm list --depth=0
```

**Expected package.json additions:**
```json
{
  "dependencies": {
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

### Step 2: Configure TypeScript

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    
    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    
    /* Linting - STRICT MODE */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/services/*": ["src/services/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/contexts/*": ["src/contexts/*"],
      "@/styles/*": ["src/styles/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Step 3: Configure Code Quality Tools

Create `.eslintrc.json`:
```json
{
  "root": true,
  "env": { "browser": true, "es2020": true },
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "ignorePatterns": ["dist", ".eslintrc.cjs"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "project": ["./tsconfig.json", "./tsconfig.node.json"],
    "tsconfigRootDir": "__dirname"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

Create `.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

Update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\"",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  }
}
```

### Step 4: Create CSS Design System

Create `src/styles/variables.css`:
```css
/* CSS Custom Properties - Design System */
:root {
  /* === COLOR SYSTEM === */
  
  /* Primary Colors */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  /* Neutral Colors */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* Status Colors */
  --color-success: #10b981;
  --color-success-light: #d1fae5;
  --color-warning: #f59e0b;
  --color-warning-light: #fef3c7;
  --color-error: #ef4444;
  --color-error-light: #fee2e2;
  --color-info: #06b6d4;
  --color-info-light: #cffafe;

  /* === TYPOGRAPHY === */
  
  /* Font Families */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;

  /* Font Sizes */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */

  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* === SPACING === */
  
  --spacing-0: 0;
  --spacing-1: 0.25rem;   /* 4px */
  --spacing-2: 0.5rem;    /* 8px */
  --spacing-3: 0.75rem;   /* 12px */
  --spacing-4: 1rem;      /* 16px */
  --spacing-5: 1.25rem;   /* 20px */
  --spacing-6: 1.5rem;    /* 24px */
  --spacing-8: 2rem;      /* 32px */
  --spacing-10: 2.5rem;   /* 40px */
  --spacing-12: 3rem;     /* 48px */
  --spacing-16: 4rem;     /* 64px */
  --spacing-20: 5rem;     /* 80px */

  /* === BORDERS === */
  
  --border-width-0: 0;
  --border-width-1: 1px;
  --border-width-2: 2px;
  --border-width-4: 4px;

  /* Border Radius */
  --border-radius-none: 0;
  --border-radius-sm: 0.125rem;
  --border-radius-md: 0.375rem;
  --border-radius-lg: 0.5rem;
  --border-radius-xl: 0.75rem;
  --border-radius-2xl: 1rem;
  --border-radius-full: 9999px;

  /* === SHADOWS === */
  
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

  /* === TRANSITIONS === */
  
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 300ms ease-in-out;
  --transition-slow: 500ms ease-in-out;

  /* === Z-INDEX === */
  
  --z-index-dropdown: 1000;
  --z-index-sticky: 1020;
  --z-index-fixed: 1030;
  --z-index-modal-backdrop: 1040;
  --z-index-modal: 1050;
  --z-index-popover: 1060;
  --z-index-tooltip: 1070;
}

/* === DARK MODE SUPPORT === */
@media (prefers-color-scheme: dark) {
  :root {
    --color-gray-50: #1f2937;
    --color-gray-100: #374151;
    --color-gray-200: #4b5563;
    --color-gray-300: #6b7280;
    --color-gray-400: #9ca3af;
    --color-gray-500: #d1d5db;
    --color-gray-600: #e5e7eb;
    --color-gray-700: #f3f4f6;
    --color-gray-800: #f9fafb;
    --color-gray-900: #ffffff;
  }
}
```

Create `src/styles/globals.css`:
```css
/* Import design system variables */
@import './variables.css';

/* === CSS RESET === */

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  line-height: 1.15;
  -webkit-text-size-adjust: 100%;
  font-family: var(--font-family-sans);
}

body {
  margin: 0;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-gray-900);
  background-color: var(--color-gray-50);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* === TYPOGRAPHY === */

h1, h2, h3, h4, h5, h6 {
  margin: 0;
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

h1 { font-size: var(--font-size-3xl); }
h2 { font-size: var(--font-size-2xl); }
h3 { font-size: var(--font-size-xl); }
h4 { font-size: var(--font-size-lg); }
h5 { font-size: var(--font-size-base); }
h6 { font-size: var(--font-size-sm); }

p {
  margin: 0 0 var(--spacing-4) 0;
}

a {
  color: var(--color-primary-600);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--color-primary-700);
  text-decoration: underline;
}

/* === FORM ELEMENTS === */

button, input, optgroup, select, textarea {
  font-family: inherit;
  font-size: 100%;
  line-height: 1.15;
  margin: 0;
}

button {
  cursor: pointer;
}

input, textarea, select {
  border: var(--border-width-1) solid var(--color-gray-300);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  transition: border-color var(--transition-fast);
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
}

/* === UTILITY CLASSES === */

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

/* === RESPONSIVE BREAKPOINTS === */

.hidden-mobile {
  display: none;
}

@media (min-width: 768px) {
  .hidden-mobile {
    display: block;
  }
  
  .hidden-desktop {
    display: none;
  }
}

/* === ANIMATIONS === */

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-up {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

Create `src/styles/components/` directory:
```bash
mkdir -p src/styles/components
```

### Step 5: Environment Configuration

Create `.env.development`:
```env
# Development Environment Variables
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Magic Auth Dashboard
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development
```

Create `.env.production`:
```env
# Production Environment Variables
VITE_API_BASE_URL=https://api.magicauth.com
VITE_APP_NAME=Magic Auth Dashboard
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

Update `src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENVIRONMENT: 'development' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Step 6: Update Main CSS Import

Update `src/main.tsx`:
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/globals.css'; // Import global styles

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 🧪 Testing & Verification

### Run Quality Checks
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting check
npm run format:check

# Build test
npm run build

# Development server
npm run dev
```

### Expected Results
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no warnings
- [ ] Prettier formatting is consistent
- [ ] Development server starts successfully
- [ ] CSS variables are working in browser dev tools

---

## 📁 Files Created/Modified

### New Files
- `src/styles/variables.css` - Design system variables
- `src/styles/globals.css` - Global styles and reset
- `src/styles/components/` - Component styles directory
- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `.env.development` - Development environment variables
- `.env.production` - Production environment variables

### Modified Files
- `package.json` - Added dependencies and scripts
- `tsconfig.json` - Enabled strict mode and path mapping
- `src/main.tsx` - Import global styles
- `src/vite-env.d.ts` - Environment variable types

---

## ✅ Completion Criteria

- [ ] All dependencies installed successfully
- [ ] TypeScript strict mode enabled and working
- [ ] ESLint and Prettier configured and working
- [ ] CSS design system with custom properties
- [ ] Environment variables configured
- [ ] All build and quality scripts working
- [ ] No console errors or warnings
- [ ] Clean git status with proper .gitignore

## 🚀 Next Steps
Proceed to [Milestone 1.2: Core Types & Constants](../1.2-types-constants/README.md) 