import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HealthComponent } from '@/types/system.types';

interface HealthIndicatorProps {
  title: string;
  component: HealthComponent;
}

const statusConfig = {
  healthy: { 
    icon: CheckCircle, 
    text: 'Healthy', 
    color: 'text-success', 
    bg: 'bg-success',
    border: 'border-success/30'
  },
  warning: { 
    icon: AlertTriangle, 
    text: 'Warning', 
    color: 'text-warning', 
    bg: 'bg-warning',
    border: 'border-warning/30'
  },
  degraded: { 
    icon: AlertTriangle, 
    text: 'Degraded', 
    color: 'text-warning', 
    bg: 'bg-warning',
    border: 'border-warning/30'
  },
  critical: { 
    icon: XCircle, 
    text: 'Critical', 
    color: 'text-destructive', 
    bg: 'bg-destructive',
    border: 'border-destructive/30'
  },
  unhealthy: { 
    icon: XCircle, 
    text: 'Unhealthy', 
    color: 'text-destructive', 
    bg: 'bg-destructive',
    border: 'border-destructive/30'
  },
};

export function HealthIndicator({ title, component }: HealthIndicatorProps): React.JSX.Element {
  const config = statusConfig[component.status] || statusConfig.unhealthy;
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
          <div className={cn('h-2 w-2 rounded-full animate-pulse', config.bg)} />
        </div>
        <div className={cn('flex items-center gap-1.5 text-xs font-medium', config.color)}>
          <StatusIcon className="h-4 w-4" />
          <span>{config.text}</span>
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