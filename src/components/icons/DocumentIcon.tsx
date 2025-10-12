import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface DocumentIconProps extends Omit<IconProps, 'name'> {}

/**
 * Document Icon - loads document.svg
 * Used for: Files, documentation, text content
 */
export function DocumentIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: DocumentIconProps): React.JSX.Element {
  return (
    <Icon
      name="document"
      size={size}
      color={color}
      className={`document-icon ${className}`}
      aria-label={ariaLabel || 'Document'}
      {...props}
    />
  );
}

export default DocumentIcon; 