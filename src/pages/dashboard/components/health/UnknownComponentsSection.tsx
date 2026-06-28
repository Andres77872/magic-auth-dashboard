/**
 * UnknownComponentsSection — future-proofing catch-all. Renders any top-level
 * component the curated sections don't already handle, so new API components
 * appear automatically (nothing is dropped). Core keys and the duplicate
 * skip-list are excluded by the parent via `handledKeys`.
 */

import React from 'react';
import { Boxes } from 'lucide-react';
import type { HealthComponent } from '@/types/system.types';
import { asString, humanizeKey } from '@/lib/health-format';
import { SubsystemPanel } from './SubsystemPanel';
import { GenericFieldList } from './GenericFieldList';

export function UnknownComponentsSection({
  components,
  handledKeys,
}: {
  components: Record<string, HealthComponent>;
  handledKeys: string[];
}): React.JSX.Element | null {
  const handled = new Set(handledKeys);
  const leftover = Object.entries(components).filter(([key]) => !handled.has(key));

  if (!leftover.length) return null;

  return (
    <>
      {leftover.map(([key, component]) => (
        <SubsystemPanel
          key={key}
          title={humanizeKey(key)}
          icon={<Boxes className="h-4 w-4 text-muted-foreground" />}
          status={asString(component.status)}
          lastCheck={asString(component.last_check)}
        >
          <GenericFieldList data={component} />
        </SubsystemPanel>
      ))}
    </>
  );
}

export default UnknownComponentsSection;
