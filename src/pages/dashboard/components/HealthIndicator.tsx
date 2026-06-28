import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusTone, type StatusTone } from '@/lib/status-tone';
import type { HealthComponent } from '@/types/system.types';

interface HealthIndicatorProps {
  title: string;
  component: HealthComponent;
}

// Derive the icon/colors from the shared status tone so any status (including
// `ready`/`disabled`/`not_ready`/`retrying` and unknown future values) renders
// correctly instead of defaulting to red "Unhealthy".
const toneConfig: Record<
  StatusTone,
  { icon: typeof CheckCircle; color: string; bg: string; border: string }
> = {
  success: { icon: CheckCircle, color: 'text-success', bg: 'bg-success', border: 'border-success/30' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning', border: 'border-warning/30' },
  destructive: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive', border: 'border-destructive/30' },
  info: { icon: RefreshCw, color: 'text-info', bg: 'bg-info', border: 'border-info/30' },
  muted: { icon: MinusCircle, color: 'text-muted-foreground', bg: 'bg-muted-foreground', border: 'border-border' },
};

function statusLabel(status?: string): string {
  if (!status) return 'Unknown';
  const text = status.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function HealthIndicator({ title, component }: HealthIndicatorProps): React.JSX.Element {
  const config = toneConfig[statusTone(component.status)];
  const StatusIcon = config.icon;

  const formatResponseTime = (time?: number) => {
    if (time === undefined) return 'N/A';
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  return (
    <div className={cn('p-4 rounded-lg border bg-card', config.border)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <div
            className={cn(
              'h-2 w-2 rounded-full animate-pulse motion-reduce:animate-none',
              config.bg
            )}
            aria-hidden="true"
          />
        </div>
        <div className={cn('flex items-center gap-1.5 text-xs font-medium', config.color)}>
          <StatusIcon className="h-4 w-4" />
          <span>{statusLabel(component.status)}</span>
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        {component.message && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className="text-foreground font-medium">{component.message}</span>
          </div>
        )}

        {component.response_time_ms !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Response Time:</span>
            <span className="text-foreground font-medium">{formatResponseTime(component.response_time_ms)}</span>
          </div>
        )}

        {component.connection_pool && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Connections:</span>
            <span className="text-foreground font-medium">{component.connection_pool}</span>
          </div>
        )}

        {component.memory_usage && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Memory:</span>
            <span className="text-foreground font-medium">{component.memory_usage}</span>
          </div>
        )}

        {component.active_sessions !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Active Sessions:</span>
            <span className="text-foreground font-medium">{component.active_sessions.toLocaleString()}</span>
          </div>
        )}

        {component.additional_info && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Info:</span>
            <span className="text-foreground font-medium">{component.additional_info}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default HealthIndicator; 