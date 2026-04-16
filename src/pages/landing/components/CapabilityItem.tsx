import React from 'react';
import { Check } from 'lucide-react';

interface CapabilityItemProps {
  title: string;
  items: string[];
}

export function CapabilityItem({
  title,
  items,
}: CapabilityItemProps): React.JSX.Element {
  return (
    <div>
      <h4 className="mb-3 font-semibold text-foreground">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check size={12} />
            </div>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CapabilityItem;
