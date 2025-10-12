import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface ExportIconProps extends Omit<IconProps, 'name'> {}

/**
 * Export Icon - loads export.svg
 * Used for: Export data, download, save actions
 */
export function ExportIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: ExportIconProps): React.JSX.Element {
  return (
    <Icon
      name="export"
      size={size}
      color={color}
      className={`export-icon ${className}`}
      aria-label={ariaLabel || 'Export'}
      {...props}
    />
  );
}

export default ExportIcon; 