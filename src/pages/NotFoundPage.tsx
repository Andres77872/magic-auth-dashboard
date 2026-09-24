import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/utils/routes';

/** Unknown console URL, rendered inside the app shell. */
export function NotFoundPage(): React.JSX.Element {
  const location = useLocation();
  return (
    <EmptyState
      icon={<Compass />}
      title="Page not found"
      description={`Nothing lives at ${location.pathname}. It may have moved, or the link is incomplete.`}
      size="lg"
      action={
        <Button asChild>
          <Link to={ROUTES.HOME}>Back to overview</Link>
        </Button>
      }
    />
  );
}

export default NotFoundPage;
