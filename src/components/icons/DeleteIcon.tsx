import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface DeleteIconProps extends Omit<IconProps, 'name'> {}

/**
 * Delete Icon - loads delete.svg
 * Used for: Delete actions, remove items
 */
export function DeleteIcon({ 
  size = 'md', 
  className = '',
  ...props
}: DeleteIconProps): React.JSX.Element {
  return (
    <Icon
      name="delete"
      size={size}
      className={`icon delete-icon ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export default DeleteIcon; 