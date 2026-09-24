import React from 'react';

interface GroupSectionHeaderProps {
  title: string;
  /** One line that explains what the relationship means. */
  description: React.ReactNode;
  actions?: React.ReactNode;
}

/** Title row above a tab's table (the table brings its own border, so no card wrapper). */
export function GroupSectionHeader({
  title,
  description,
  actions,
}: GroupSectionHeaderProps): React.JSX.Element {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold leading-snug text-foreground">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export default GroupSectionHeader;
