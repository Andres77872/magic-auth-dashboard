import React from 'react';
import { cn } from '@/lib/utils';

/** Page gutter and max width shared by every landing section. */
export const LANDING_CONTAINER =
  'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';

interface LandingSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** A titled page section with an anchor the header navigation links to. */
export function LandingSection({
  id,
  eyebrow,
  title,
  description,
  className,
  children,
}: LandingSectionProps): React.JSX.Element {
  const titleId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn(
        'scroll-mt-16 border-t border-border/70 py-20 sm:py-24',
        className
      )}
    >
      <div className={LANDING_CONTAINER}>
        <div className="max-w-2xl">
          <p className="ds-overline m-0 text-primary">{eyebrow}</p>
          <h2
            id={titleId}
            className="m-0 mt-3 text-3xl font-semibold leading-tight tracking-[-0.025em] text-foreground sm:text-4xl"
          >
            {title}
          </h2>
          {description && (
            <p className="m-0 mt-4 text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

export default LandingSection;
