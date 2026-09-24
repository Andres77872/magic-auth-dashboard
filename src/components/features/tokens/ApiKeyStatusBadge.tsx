import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  computeApiKeyStatus,
  type ApiKey,
  type ApiKeyStatus,
} from '@/types/api-key.types';

const STATUS: Record<
  ApiKeyStatus,
  { label: string; variant: 'success' | 'warning' | 'destructive' }
> = {
  active: { label: 'Active', variant: 'success' },
  expired: { label: 'Expired', variant: 'warning' },
  revoked: { label: 'Revoked', variant: 'destructive' },
};

export function ApiKeyStatusBadge({
  apiKey,
}: {
  apiKey: Pick<ApiKey, 'is_active' | 'revoked_at' | 'expires_at'>;
}): React.JSX.Element {
  const { label, variant } = STATUS[computeApiKeyStatus(apiKey)];
  return (
    <Badge variant={variant} size="sm">
      {label}
    </Badge>
  );
}

export default ApiKeyStatusBadge;
