import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface ProjectIconProps extends Omit<IconProps, 'name'> {}

/**
 * Project Icon - loads project.svg
 * Used for: Projects, folders, workspaces
 */
export function ProjectIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: ProjectIconProps): React.JSX.Element {
  return (
    <Icon
      name="project"
      size={size}
      color={color}
      className={`project-icon ${className}`}
      aria-label={ariaLabel || 'Project'}
      {...props}
    />
  );
}

export default ProjectIcon; 