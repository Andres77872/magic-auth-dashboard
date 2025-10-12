import React, { type CSSProperties, useEffect, useState } from 'react';

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  color?: string;
  className?: string;
  'aria-label'?: string;
}

// Icon size scale following design system
const iconSizeMap = {
  xs: 12,
  sm: 16,
  md: 20,  // Default
  lg: 24,
  xl: 32,
} as const;

// Cache for loaded SVG content
const svgCache = new Map<string, string>();

/**
 * Base Icon component that loads and inlines SVG files from public/icons directory
 * @param name - Name of the SVG file (without .svg extension)
 * @param size - Size preset (xs/sm/md/lg/xl) or custom number in pixels
 * @param color - Color value (defaults to currentColor for theme inheritance)
 * @param className - Additional CSS classes
 * @param aria-label - Accessibility label
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