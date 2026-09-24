import React from 'react';
import type { LucideProps } from 'lucide-react';
import { NAV_ICONS } from './nav-utils';
import { LayoutDashboard } from 'lucide-react';

interface NavIconProps extends LucideProps {
  icon: string;
}

/** Renders the Lucide icon registered for a navigation icon key. */
export function NavIcon({ icon, ...props }: NavIconProps): React.JSX.Element {
  const IconComponent = NAV_ICONS[icon] ?? LayoutDashboard;
  return <IconComponent {...props} />;
}

export default NavIcon;
