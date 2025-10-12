import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface EditIconProps extends Omit<IconProps, 'name'> {}

/**
 * Edit Icon - loads edit.svg
 * Used for: Edit actions, modify content
 */
export function EditIcon({ 
  size = 'md', 
  className = '',
  ...props
}: EditIconProps): React.JSX.Element {
  return (
    <Icon
      name="edit"
      size={size}
      className={`icon edit-icon ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export default EditIcon; 