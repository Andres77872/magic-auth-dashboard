// Design Token Type Definitions

/* === COLOR TOKENS === */
export type ColorScale = 
  | '50' | '100' | '200' | '300' | '400' 
  | '500' | '600' | '700' | '800' | '900';

export type ColorPrimitive = 
  | `blue-${ColorScale}`
  | `gray-${ColorScale}`
  | `green-${ColorScale}`
  | `red-${ColorScale}`
  | `yellow-${ColorScale}`
  | `cyan-${ColorScale}`;

export type ColorSemantic = 
  | `primary-${ColorScale}`
  | 'success' | 'success-light' | 'success-dark'
  | 'warning' | 'warning-light' | 'warning-dark'
  | 'error' | 'error-light' | 'error-dark'
  | 'info' | 'info-light' | 'info-dark';

export type ColorComponent = 
  | 'background' | 'background-subtle' | 'background-muted'
  | 'text' | 'text-muted' | 'text-subtle'
  | 'border' | 'border-muted' | 'border-strong';

export type ColorState = 
  | 'hover-subtle' | 'hover-muted'
  | 'focus-ring'
  | 'active';

export type ColorToken = ColorPrimitive | ColorSemantic | ColorComponent | ColorState;

/* === SPACING TOKENS === */
export type SpacingScale = 
  | '0' | '0-5' | '1' | '1-5' | '2' | '2-5' | '3' | '3-5' | '4' | '5' 
  | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '14' | '16' | '20' 
  | '24' | '28' | '32' | '36' | '40' | '44' | '48' | '52' | '56' 
  | '60' | '64' | '72' | '80' | '96';

export type SpacingComponent = 
  | `button-${'x-sm' | 'sm' | 'md' | 'lg' | 'xl'}`
  | `input-${'sm' | 'md' | 'lg'}`
  | `card-${'sm' | 'md' | 'lg' | 'xl'}`
  | `section-${'sm' | 'md' | 'lg' | 'xl'}`
  | `container-${'sm' | 'md' | 'lg' | 'xl'}`
  | `grid-${'sm' | 'md' | 'lg' | 'xl'}`
  | `stack-${'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'}`
  | `mobile-${'xs' | 'sm' | 'md' | 'lg' | 'xl'}`;

export type SpacingToken = SpacingScale | SpacingComponent;

/* === TYPOGRAPHY TOKENS === */
export type FontFamily = 'primary' | 'secondary' | 'monospace';

export type FontSize = 
  | 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' 
  | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';

export type FontWeight = 
  | 'thin' | 'extralight' | 'light' | 'normal' | 'medium' 
  | 'semibold' | 'bold' | 'extrabold' | 'black';

export type LineHeight = 
  | 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';

export type LetterSpacing = 
  | 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest';

export type TypographyContext = 
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'body-lg' | 'body' | 'body-sm' | 'body-xs'
  | 'caption' | 'overline' | 'label'
  | 'code' | 'code-sm';

/* === SHADOW TOKENS === */
export type ShadowScale = 
  | 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'inner';

export type ShadowColored = 
  | 'primary' | 'success' | 'warning' | 'error';

export type ShadowContext = 
  | 'card' | 'card-hover' | 'card-elevated'
  | 'button' | 'button-hover' | 'button-pressed'
  | 'modal' | 'modal-backdrop'
  | 'dropdown' | 'tooltip' | 'popover'
  | 'focus-primary' | 'focus-error' | 'focus-success' | 'focus-warning';

export type ShadowToken = ShadowScale | ShadowColored | ShadowContext;

/* === BORDER TOKENS === */
export type BorderRadius = 
  | 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

export type BorderWidth = '0' | '1' | '2' | '4' | '8';

export type BorderContext = 
  | 'input' | 'input-hover' | 'input-focus' | 'input-error'
  | 'button' | 'button-outline' | 'button-outline-hover'
  | 'card' | 'card-hover'
  | 'divider' | 'divider-strong';

export type BorderRadiusContext = 
  | 'button' | 'input' | 'card' | 'modal' | 'tooltip';

/* === TRANSITION TOKENS === */
export type TransitionDuration = 
  | 'none' | 'fast' | 'normal' | 'slow' | 'slower' | 'slowest';

export type TransitionTiming = 
  | 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';

export type TransitionProperty = 
  | 'colors' | 'transform' | 'transform-gpu' | 'opacity' | 'shadow' 
  | 'all' | 'all-normal';

export type TransitionContext = 
  | 'interactive' | 'button' | 'input' 
  | 'modal-backdrop' | 'modal-content'
  | 'nav' | 'card';

/* === BREAKPOINT TOKENS === */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type BreakpointContext = 
  | 'mobile-nav' | 'desktop-nav'
  | 'sidebar-mobile' | 'sidebar-collapse'
  | 'text-scale'
  | 'grid-stack' | 'grid-cols-2' | 'grid-cols-3' | 'grid-cols-4';

/* === DESIGN TOKEN UTILITY TYPES === */
export interface DesignTokens {
  colors: Record<ColorToken, string>;
  spacing: Record<SpacingToken, string>;
  typography: {
    fontFamily: Record<FontFamily, string>;
    fontSize: Record<FontSize, string>;
    fontWeight: Record<FontWeight, number>;
    lineHeight: Record<LineHeight, number>;
    letterSpacing: Record<LetterSpacing, string>;
    context: Record<TypographyContext, string>;
  };
  shadows: Record<ShadowToken, string>;
  borders: {
    radius: Record<BorderRadius, string>;
    width: Record<BorderWidth, string>;
    context: Record<BorderContext, string>;
    radiusContext: Record<BorderRadiusContext, string>;
  };
  transitions: {
    duration: Record<TransitionDuration, string>;
    timing: Record<TransitionTiming, string>;
    property: Record<TransitionProperty, string>;
    context: Record<TransitionContext, string>;
  };
  breakpoints: {
    values: Record<Breakpoint, string>;
    context: Record<BreakpointContext, string>;
  };
}

/* === TOKEN HELPER FUNCTIONS === */
export type TokenValue<T extends keyof DesignTokens> = DesignTokens[T];

export interface TokenTheme {
  light: Partial<DesignTokens>;
  dark: Partial<DesignTokens>;
}

/* === COMPONENT TOKEN TYPES === */
export interface ComponentTokens {
  button: {
    padding: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string>;
    radius: string;
    shadow: string;
    transition: string;
  };
  input: {
    padding: Record<'sm' | 'md' | 'lg', string>;
    radius: string;
    border: string;
    transition: string;
  };
  card: {
    padding: Record<'sm' | 'md' | 'lg' | 'xl', string>;
    radius: string;
    shadow: string;
    transition: string;
  };
} 