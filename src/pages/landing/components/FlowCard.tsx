import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FlowItem {
  label: string;
  variant: 'primary' | 'secondary';
}

interface FlowCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  flowItems: FlowItem[];
  note: string;
}

export function FlowCard({
  icon,
  title,
  description,
  flowItems,
  note,
}: FlowCardProps): React.JSX.Element {
  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {icon}
          </div>
          <h3 className="mb-2 text-xl font-bold text-foreground">{title}</h3>
          <p className="mb-5 text-sm text-muted-foreground">{description}</p>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {flowItems.map((item, index) => (
              <React.Fragment key={index}>
                <Badge variant={item.variant} size="md">
                  {item.label}
                </Badge>
                {index < flowItems.length - 1 && (
                  <ArrowRight size={14} className="text-muted-foreground" />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{note}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default FlowCard;
