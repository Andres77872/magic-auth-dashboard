import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const sliderTrackVariants = cva('relative w-full grow overflow-hidden rounded-full bg-primary/20', {
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-1.5',
      lg: 'h-2',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const sliderThumbVariants = cva(
  'block rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface SliderProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'value' | 'onValueChange' | 'onChange'>,
    VariantProps<typeof sliderTrackVariants> {
  value?: number;
  onChange?: (value: number) => void;
  onValueChange?: (value: number[]) => void;
  showValue?: boolean;
  label?: string;
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, size, value, onChange, onValueChange, showValue = false, label, disabled, ...props }, ref) => {
    const handleValueChange = (values: number[]) => {
      if (onChange) {
        onChange(values[0]);
      }
      if (onValueChange) {
        onValueChange(values);
      }
    };

    return (
      <div className={cn('w-full', disabled && 'opacity-50', className)}>
        {(label || showValue) && (
          <div className="mb-2 flex items-center justify-between text-sm">
            {label && <label className="text-muted-foreground">{label}</label>}
            {showValue && value !== undefined && (
              <span className="text-muted-foreground" aria-live="polite">
                {value}
              </span>
            )}
          </div>
        )}
        <SliderPrimitive.Root
          ref={ref}
          className="relative flex w-full touch-none select-none items-center"
          value={value !== undefined ? [value] : undefined}
          onValueChange={handleValueChange}
          disabled={disabled}
          {...props}
        >
          <SliderPrimitive.Track className={cn(sliderTrackVariants({ size }))}>
            <SliderPrimitive.Range className="absolute h-full bg-primary" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className={cn(sliderThumbVariants({ size }))} />
        </SliderPrimitive.Root>
      </div>
    );
  }
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider, sliderTrackVariants, sliderThumbVariants };
