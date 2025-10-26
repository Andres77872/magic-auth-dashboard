import React, { type CSSProperties, useEffect, useState } from 'react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  name: string;
  size?: IconSize | number;
  color?: string;
  className?: string;
  'aria-label'?: string;
}

// Icon size scale following design system
// Maps string sizes to pixel values
const iconSizeMap: Record<IconSize, number> = {
  xs: 12,  // Inline text indicators, badges
  sm: 16,  // Buttons, compact UI
  md: 20,  // Default - Navigation, standard icons
  lg: 24,  // Headers, prominent actions
  xl: 32,  // Hero sections, large displays
} as const;

// Cache for loaded SVG content
const svgCache = new Map<string, string>();

/**
 * Base Icon component that loads and inlines SVG files from public/icons directory
 * 
 * @param name - Name of the SVG file (without .svg extension)
 * @param size - Size preset: 'xs' (12px), 'sm' (16px), 'md' (20px), 'lg' (24px), 'xl' (32px), or custom number in pixels (default: 'md')
 * @param color - Color value (defaults to currentColor for theme inheritance)
 * @param className - Additional CSS classes
 * @param aria-label - Accessibility label
 * 
 * @example
 * // Recommended: use string sizes
 * <Icon name="user" size="md" />
 * 
 * @example
 * // Special cases: numeric pixels
 * <Icon name="user" size={20} />
 */
export function Icon({
  name,
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  style,
  ...props
}: IconProps): React.JSX.Element {
  const [svgContent, setSvgContent] = useState<string>('');
  const iconSize = typeof size === 'number' ? size : iconSizeMap[size];
  
  useEffect(() => {
    // Check cache first
    if (svgCache.has(name)) {
      setSvgContent(svgCache.get(name)!);
      return;
    }

    // Fetch SVG content
    fetch(`/icons/${name}.svg`)
      .then((response) => response.text())
      .then((svg) => {
        svgCache.set(name, svg);
        setSvgContent(svg);
      })
      .catch((error) => {
        console.error(`Failed to load icon: ${name}`, error);
      });
  }, [name]);

  const iconClasses = [
    'icon',
    `icon-${name}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconStyle: CSSProperties = {
    display: 'inline-block',
    width: iconSize,
    height: iconSize,
    color,
    flexShrink: 0,
    ...style,
  };

  // Parse SVG and inject size and color
  if (!svgContent) {
    // Return placeholder while loading
    return (
      <span
        className={iconClasses}
        style={iconStyle}
        aria-label={ariaLabel}
        {...(props as any)}
      />
    );
  }

  // Create a wrapper div and inject the SVG
  return (
    <span
      className={iconClasses}
      style={iconStyle}
      aria-label={ariaLabel}
      dangerouslySetInnerHTML={{
        __html: svgContent
          .replace(/<svg/, `<svg width="${iconSize}" height="${iconSize}" style="display:block;color:${color}"`)
      }}
      {...(props as any)}
    />
  );
}

export default Icon; 