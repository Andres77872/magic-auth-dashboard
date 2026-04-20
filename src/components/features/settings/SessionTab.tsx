/**
 * Session Tab
 *
 * Displays session expiry information with countdown.
 * Auto-refresh is handled by AuthContext timer (background orchestration).
 * Read-only — no manual actions.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/utils';

export function SessionTab(): React.JSX.Element {
  const { sessionExpiresAt, refreshSession } = useAuth();
  
  // State
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isNearExpiry, setIsNearExpiry] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update countdown every minute
  useEffect(() => {
    if (!sessionExpiresAt) return;

    const updateCountdown = (): void => {
      const expiry = new Date(sessionExpiresAt);
      const now = new Date();
      const diffMs = expiry.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeRemaining('Expired');
        setIsNearExpiry(true);
        return;
      }

      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;

      if (diffHours > 0) {
        setTimeRemaining(`${diffHours}h ${remainingMins}m remaining`);
      } else {
        setTimeRemaining(`${remainingMins} minutes remaining`);
      }

      // Near expiry warning (less than 10 minutes)
      setIsNearExpiry(diffMins < 10);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    return (): void => clearInterval(interval);
  }, [sessionExpiresAt]);

  // Format absolute expiry time
  const formattedExpiry = useMemo(() => {
    if (!sessionExpiresAt) return null;
    const expiry = new Date(sessionExpiresAt);
    return expiry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [sessionExpiresAt]);

  // Manual refresh handler (fallback)
  const handleManualRefresh = (): void => {
    setIsRefreshing(true);
    void refreshSession().then((success) => {
      setIsRefreshing(false);
      
      if (!success) {
        console.warn('Manual session refresh failed');
      }
    });
  };

  // Handle missing expiry info
  if (!sessionExpiresAt) {
    return (
      <>
        {/* Info callout */}
        <div className="rounded-lg border border-info/30 bg-info/5 p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-info mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Dashboard Session</h3>
              <p className="text-sm text-muted-foreground">
                This is your dashboard login session. It keeps you signed in to the web interface.
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder state */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground" />
            <h3 className="font-semibold">Session Information Not Available</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Session expiry information is not currently available. 
              Your session will remain active as long as you're using the dashboard.
            </p>
            <Button variant="outline" onClick={handleManualRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Session
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Info callout */}
      <div className="rounded-lg border border-info/30 bg-info/5 p-4">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-info mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">Dashboard Session</h3>
            <p className="text-sm text-muted-foreground">
              This is your dashboard login session. It keeps you signed in to the web interface.
            </p>
          </div>
        </div>
      </div>

      {/* Session status card */}
      <div className={cn(
        'rounded-lg border bg-card p-6',
        isNearExpiry ? 'border-warning/30 bg-warning/5' : 'border-border'
      )}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center',
                isNearExpiry ? 'bg-warning/10' : 'bg-success/10'
              )}>
                {isNearExpiry ? (
                  <AlertTriangle className="h-5 w-5 text-warning" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-success" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">Session Status</h3>
                <p className="text-sm text-muted-foreground">
                  Your dashboard authentication session
                </p>
              </div>
            </div>
            <Badge 
              variant={isNearExpiry ? 'subtleWarning' : 'subtleSuccess'} 
              size="md"
            >
              {isNearExpiry ? 'Expiring Soon' : 'Active'}
            </Badge>
          </div>

          {/* Expiry details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Absolute expiry */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Expires At
              </label>
              <p className={cn(
                'text-lg font-semibold',
                isNearExpiry && 'text-warning'
              )}>
                {formattedExpiry ? `Expires at ${formattedExpiry}` : 'Unknown'}
              </p>
            </div>

            {/* Relative expiry */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Time Remaining
              </label>
              <p className={cn(
                'text-lg font-semibold',
                isNearExpiry && 'text-warning'
              )}>
                {timeRemaining}
              </p>
            </div>
          </div>

          {/* Near expiry warning */}
          {isNearExpiry && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Session Expiring Soon</h4>
                  <p className="text-sm text-muted-foreground">
                    Your session will expire soon. Auto-refresh will extend it automatically.
                    If refresh fails, you'll need to log in again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Auto-refresh info */}
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <RefreshCw className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-1">Auto-Refresh Enabled</h4>
                <p className="text-sm text-muted-foreground">
                  Your session is automatically refreshed 5 minutes before expiry.
                  No manual action is required to keep your session active.
                </p>
              </div>
            </div>
          </div>

          {/* Note about session tokens */}
          <p className="text-xs text-muted-foreground">
            Note: Session tokens are for dashboard authentication only and are never displayed.
            For programmatic access, manage API tokens from the API Tokens section in the main navigation.
          </p>
        </div>
      </div>
    </>
  );
}

export default SessionTab;