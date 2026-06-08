import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { initials, tintFor } from '@/lib/avatar-tint';

// Meridian `.av`: circular, deterministic tinted monogram, 1px inset hairline.
const avatarVariants = cva(
  'inline-flex shrink-0 select-none items-center justify-center rounded-full font-medium ring-1 ring-inset ring-foreground/10',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-[10px]',
        sm: 'h-7 w-7 text-xs',
        md: 'h-8 w-8 text-[13px]',
        lg: 'h-10 w-10 text-sm',
        xl: 'h-12 w-12 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatarVariants> {
  /** Name used to derive initials and a deterministic tint. */
  name?: string;
  /** Optional image; falls back to the tinted monogram when absent. */
  src?: string;
  alt?: string;
}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, size, name = '', src, alt, style, ...props }, ref) => {
    if (src) {
      return (
        <span
          ref={ref}
          className={cn(avatarVariants({ size }), 'overflow-hidden', className)}
          style={style}
          {...props}
        >
          <img
            src={src}
            alt={alt ?? name}
            className="h-full w-full object-cover"
          />
        </span>
      );
    }

    const [bg, fg] = tintFor(name || '?');
    return (
      <span
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        style={{ background: bg, color: fg, ...style }}
        aria-label={alt ?? (name || undefined)}
        {...props}
      >
        {initials(name) || '?'}
      </span>
    );
  }
);
Avatar.displayName = 'Avatar';

export { Avatar, avatarVariants };
