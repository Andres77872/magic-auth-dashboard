import React from 'react';
import {
  CreditCard,
  FolderKanban,
  HeartHandshake,
  KeyRound,
  Layers,
  LogIn,
  Mail,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getActivityCategory,
  getActivityTone,
  type ActivityCategory,
} from '@/utils/activity';

const CATEGORY_ICONS: Record<ActivityCategory, typeof LogIn> = {
  auth: LogIn,
  user: UserRound,
  project: FolderKanban,
  group: Users,
  access: ShieldCheck,
  bulk: Layers,
  email: Mail,
  oauth: KeyRound,
  patreon: HeartHandshake,
  billing: CreditCard,
  system: Settings2,
};

const TONE_CLASSES = {
  default: 'bg-secondary text-muted-foreground',
  success: 'bg-success-subtle text-success-subtle-foreground',
  warning: 'bg-warning-subtle text-warning-subtle-foreground',
  destructive: 'bg-destructive-subtle text-destructive-subtle-foreground',
} as const;

interface ActivityIconProps {
  activityType: string;
  className?: string;
}

/** Round category icon for an activity entry, tinted by outcome. */
export function ActivityIcon({
  activityType,
  className,
}: ActivityIconProps): React.JSX.Element {
  const IconComponent = CATEGORY_ICONS[getActivityCategory(activityType)];
  return (
    <span
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
        TONE_CLASSES[getActivityTone(activityType)],
        className
      )}
      aria-hidden="true"
    >
      <IconComponent className="h-3.5 w-3.5" />
    </span>
  );
}

export default ActivityIcon;
