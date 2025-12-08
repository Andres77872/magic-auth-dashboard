import React from 'react';
import { Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ComingSoonProps {
  title: string;
  description: string;
  feature: string;
  backUrl?: string;
  backLabel?: string;
}

export function ComingSoon({
  title,
  description,
  feature,
  backUrl = '/dashboard',
  backLabel = 'Back to Dashboard',
}: ComingSoonProps): React.JSX.Element {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Card className="max-w-lg">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <div
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            <Clock className="h-8 w-8" />
          </div>

          <h1 className="mb-2 text-2xl font-semibold">{title}</h1>
          <p className="mb-6 text-muted-foreground">{description}</p>

          <div className="mb-6 rounded-lg bg-muted p-4">
            <Badge className="mb-2">Coming Soon</Badge>
            <p className="text-sm text-muted-foreground">
              {feature} functionality will be implemented in an upcoming milestone.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => (window.location.href = backUrl)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {backLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ComingSoon; 