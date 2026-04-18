import React from 'react';
import { useAuth, useUserType } from '@/hooks';
import { PageContainer, PageHeader, Card, CardHeader, CardContent, Badge } from '@/components/common';
import { UserAvatar } from '@/components/features/users/UserAvatar';
import { User, Settings2, Shield, Clock } from 'lucide-react';
import { getUserTypeBadgeVariant } from '@/utils/component-utils';

/**
 * ProfilePage - User's own profile page for self-service account management
 * 
 * Note: Profile settings management (password change, email update, etc.) is
 * deferred to a future milestone. This page currently displays user information.
 */
export function ProfilePage(): React.JSX.Element {
  const { user } = useAuth();
  const { getUserTypeLabel, userType } = useUserType();

  if (!user) {
    return (
      <PageContainer maxWidth="lg" as="main">
        <PageHeader title="Profile" icon={<User size={24} aria-hidden="true" />} />
        <Card padding="lg">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Unable to load profile information.</p>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="lg" as="main">
      <PageHeader 
        title="Profile" 
        subtitle="Manage your account settings and preferences"
        icon={<User size={24} aria-hidden="true" />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Identity Card - Left column on desktop, full width on mobile */}
        <Card padding="lg" elevated className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <UserAvatar 
              username={user.username} 
              userType={userType}
              size="lg"
              className="h-20 w-20 text-2xl"
            />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">{user.username}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge 
                variant={getUserTypeBadgeVariant(userType || undefined)}
                size="md"
              >
                {getUserTypeLabel()}
              </Badge>
            </div>
            {user.last_login && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <Clock size={14} aria-hidden="true" />
                <span>Last login: {new Date(user.last_login).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Details Card - Right column on desktop */}
        <Card padding="lg" className="lg:col-span-2">
          <CardHeader>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Settings2 size={18} aria-hidden="true" />
              Account Details
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email Address
                </label>
                <p className="text-sm font-medium">{user.email || 'Not provided'}</p>
              </div>

              {/* User Hash */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User ID
                </label>
                <p className="text-xs font-mono text-muted-foreground">{user.user_hash}</p>
              </div>

              {/* Account Status */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </label>
                <Badge 
                  variant={user.is_active ? 'success' : 'secondary'}
                  size="sm"
                  dot
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Account Created */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </label>
                <p className="text-sm">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Summary Card */}
        {(user.groups?.length > 0 || user.projects?.length > 0) && (
          <Card padding="lg" className="lg:col-span-3">
            <CardHeader>
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <Shield size={18} aria-hidden="true" />
                Access Summary
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Groups */}
                {user.groups && user.groups.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Groups ({user.groups.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {user.groups.slice(0, 5).map((group) => (
                        <Badge key={group.group_hash} variant="secondary" size="sm">
                          {group.group_name}
                        </Badge>
                      ))}
                      {user.groups.length > 5 && (
                        <Badge variant="outline" size="sm">
                          +{user.groups.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {user.projects && user.projects.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Projects ({user.projects.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {user.projects.slice(0, 5).map((project) => (
                        <Badge key={project.project_hash} variant="outline" size="sm">
                          {project.project_name}
                        </Badge>
                      ))}
                      {user.projects.length > 5 && (
                        <Badge variant="outline" size="sm">
                          +{user.projects.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Placeholder for future profile settings */}
        <Card padding="lg" className="lg:col-span-3">
          <CardContent>
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-muted-subtle flex items-center justify-center">
                <Settings2 size={24} className="text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Profile Settings</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Profile management features (password change, email update, preferences) 
                  will be implemented in a future milestone.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default ProfilePage;