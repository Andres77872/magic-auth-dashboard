import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useUserType } from '@/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { User, CheckCircle2 } from 'lucide-react';

const userTypeStyles = {
  root: 'bg-destructive/10 text-destructive border-destructive/30',
  admin: 'bg-warning/10 text-warning border-warning/30',
  consumer: 'bg-primary/10 text-primary border-primary/30',
};

export function WelcomeSection(): React.JSX.Element {
  const { user } = useAuth();
  const { getUserTypeLabel, userType } = useUserType();

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatLastLogin = (): string => {
    return 'Today at 9:30 AM';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <section 
      className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-background via-background to-primary/5 p-6 sm:p-8"
      aria-labelledby="welcome-title"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-success/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
          <h1 
            id="welcome-title" 
            className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight"
          >
            {getGreeting()}, {user.username}!
          </h1>
          <p className="text-muted-foreground">
            Welcome back to the Magic Auth Admin Dashboard
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Badge 
              variant="outline" 
              className={cn('px-2.5 py-0.5', userTypeStyles[userType as keyof typeof userTypeStyles])}
              aria-label={`User type: ${getUserTypeLabel()}`}
            >
              {getUserTypeLabel()}
            </Badge>
            
            <span className="text-sm text-muted-foreground">
              Last login: <span className="text-foreground font-medium">{formatLastLogin()}</span>
            </span>
            
            <div className="flex items-center gap-1.5 text-success">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">System Online</span>
            </div>
          </div>
        </div>

        <Button variant="outline" asChild className="shrink-0">
          <Link to="/dashboard/profile">
            <User className="h-4 w-4 mr-2" />
            View Profile
          </Link>
        </Button>
      </div>
    </section>
  );
}

export default WelcomeSection;
