import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface SettingsIconProps extends Omit<IconProps, 'name'> {}

/**
 * Settings Icon - loads settings.svg
 * Used for: Settings pages, configuration, preferences
 */
export function SettingsIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: SettingsIconProps): React.JSX.Element {
  return (
    <Icon
      name="settings"
      size={size}
      color={color}
      className={`settings-icon ${className}`}
      aria-label={ariaLabel || 'Settings'}
      {...props}
    />
  );
}

export default SettingsIcon; 