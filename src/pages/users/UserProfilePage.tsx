import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageContainer, PageHeader, Card, CardHeader, CardContent, Badge, Skeleton, EmptyState, Button, CopyableId } from '@/components/common';
import { UserPermissionGroupsTab } from '@/components/features/users/UserPermissionGroupsTab';
import { UserAvatar } from '@/components/features/users/UserAvatar';
import { useUserProfileDetails } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import { getUserTypeBadgeVariant, formatDateTime } from '@/utils/component-utils';
import {
  User,
  XCircle,
  RefreshCw,
  Pencil,
  ArrowLeft,
  ShieldCheck,
  Lock,
  AlertTriangle,
  FolderKanban,
  Users,
  Zap,
  Calendar,
  Activity,
  Hash,
  Mail,
  Clock,
  Key,
} from 'lucide-react';
import type { UserType } from '@/types/auth.types';

/**
 * UserProfilePage - Admin-facing detailed user profile view
 * Displays comprehensive user information including permissions, groups, projects, and statistics.
 */
export function UserProfilePage(): React.JSX.Element {
  const navigate = useNavigate();
  const { userHash } = useParams<{ userHash: string }>();
  const {
    profileData,
    isLoading,
    error,
    globalRole,
    permissionSources,
    isGlobalDataLoading,
    refetch,
  } = useUserProfileDetails(userHash);

  const handleGoBack = () => {
    navigate(ROUTES.USERS);
  };

  const handleEditUser = () => {
    if (userHash) {
      navigate(`${ROUTES.USERS_EDIT}/${userHash}`);
    }
  };

  // Loading state with proper skeleton
  if (isLoading) {
    return (
      <PageContainer maxWidth="xl" as="main">
        <div className="flex items-center gap-4 pb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleGoBack}
            leftIcon={<ArrowLeft size={16} aria-hidden="true" />}
          >
            Back to Users
          </Button>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* User info skeleton */}
          <Card padding="lg" className="lg:col-span-1">
            <div className="flex flex-col items-center gap-4 py-4">
              <Skeleton variant="avatar-lg" className="h-20 w-20" />
              <div className="space-y-2 text-center">
                <Skeleton variant="title" width="60%" className="mx-auto" />
                <Skeleton variant="text" width="40%" className="mx-auto" />
                <Skeleton variant="text" width="30%" className="mx-auto" />
              </div>
            </div>
          </Card>
          {/* Details skeleton */}
          <Card padding="lg" className="lg:col-span-2">
            <Skeleton variant="title" className="mb-4" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton variant="text" width="30%" />
                  <Skeleton variant="text" width="50%" />
                </div>
              ))}
            </div>
          </Card>
          {/* Stats skeleton */}
          <Card padding="lg" className="lg:col-span-3">
            <Skeleton variant="title" className="mb-4" />
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="title" width="30%" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (error && !profileData) {
    return (
      <PageContainer maxWidth="xl" as="main">
        <div className="flex items-center gap-4 pb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleGoBack}
            leftIcon={<ArrowLeft size={16} aria-hidden="true" />}
          >
            Back to Users
          </Button>
        </div>
        <EmptyState
          icon={<XCircle size={32} />}
          title="Failed to Load User Profile"
          description={error}
          action={
            <Button
              onClick={() => void refetch()}
              variant="primary"
              leftIcon={<RefreshCw size={16} aria-hidden="true" />}
              aria-label="Retry loading user profile"
            >
              Try Again
            </Button>
          }
        />
      </PageContainer>
    );
  }

  // User not found state
  if (!profileData || !profileData.user) {
    return (
      <PageContainer maxWidth="xl" as="main">
        <div className="flex items-center gap-4 pb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleGoBack}
            leftIcon={<ArrowLeft size={16} aria-hidden="true" />}
          >
            Back to Users
          </Button>
        </div>
        <EmptyState
          icon={<User size={32} />}
          title="User Not Found"
          description="The user you're looking for doesn't exist or has been deleted."
          action={
            <Button
              onClick={handleGoBack}
              variant="primary"
              leftIcon={<ArrowLeft size={16} aria-hidden="true" />}
              aria-label="Go back to users list"
            >
              Back to Users
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const { user, permissions, statistics } = profileData;
  const userGroups = user.groups || [];
  const userProjects = user.projects || [];

  // Default statistics fallback
  const defaultStatistics = {
    total_groups: 0,
    total_accessible_projects: 0,
    total_permissions: 0,
    account_age_days: 0,
  };
  const stats = statistics ?? defaultStatistics;

  return (
    <PageContainer maxWidth="xl" as="main">
      {/* Page Header with back button */}
      <header className="space-y-4 pb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleGoBack}
            leftIcon={<ArrowLeft size={16} aria-hidden="true" />}
          >
            Back to Users
          </Button>
        </div>
        <PageHeader 
          title="User Profile"
          subtitle={`Detailed information about ${user.username}`}
          icon={<User size={24} aria-hidden="true" />}
          actions={
            <Button
              onClick={handleEditUser}
              variant="primary"
              leftIcon={<Pencil size={16} aria-hidden="true" />}
              aria-label="Edit user profile"
            >
              Edit User
            </Button>
          }
        />
      </header>

      {/* Main grid layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Identity Card */}
        <Card padding="lg" elevated className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <UserAvatar 
              username={user.username} 
              userType={user.user_type}
              size="lg"
              className="h-20 w-20 text-2xl"
            />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">{user.username}</h2>
              <CopyableId id={user.user_hash} className="mt-1" />
              <div className="flex items-center justify-center gap-2">
                <Badge 
                  variant={getUserTypeBadgeVariant(user.user_type)}
                  size="md"
                >
                  {user.user_type.toUpperCase()}
                </Badge>
                <Badge 
                  variant={user.is_active ? 'success' : 'secondary'}
                  size="sm"
                  dot
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <Calendar size={14} aria-hidden="true" />
              <span>Account age: {stats.account_age_days} days</span>
            </div>
          </CardContent>
        </Card>

        {/* User Details Card */}
        <Card padding="lg" className="lg:col-span-2">
          <CardHeader>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <User size={18} aria-hidden="true" />
              Account Information
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Email */}
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Mail size={12} aria-hidden="true" />
                  Email Address
                </label>
                <p className="text-sm font-medium">{user.email || 'Not provided'}</p>
              </div>

              {/* User Hash */}
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Hash size={12} aria-hidden="true" />
                  User Hash
                </label>
                <CopyableId id={user.user_hash} showFull />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Activity size={12} aria-hidden="true" />
                  Account Status
                </label>
                <Badge 
                  variant={user.is_active ? 'success' : 'secondary'}
                  size="sm"
                  dot
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Created */}
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Clock size={12} aria-hidden="true" />
                  Created At
                </label>
                <p className="text-sm">{formatDateTime(user.created_at)}</p>
              </div>

              {/* Last Updated */}
              {user.updated_at && (
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <RefreshCw size={12} aria-hidden="true" />
                    Last Updated
                  </label>
                  <p className="text-sm">{formatDateTime(user.updated_at)}</p>
                </div>
              )}

              {/* Last Login */}
              {user.last_login && (
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Key size={12} aria-hidden="true" />
                    Last Login
                  </label>
                  <p className="text-sm">{formatDateTime(user.last_login)}</p>
                </div>
              )}

              {/* User Type Info / Capabilities */}
              {user.user_type_info &&
                (user.user_type_info.error ? (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <AlertTriangle size={12} aria-hidden="true" />
                      User Type Status
                    </label>
                    <div className="flex items-center gap-2 text-destructive bg-destructive-subtle rounded-md px-3 py-2">
                      <AlertTriangle size={14} aria-hidden="true" />
                      <span className="text-sm">{user.user_type_info.error}</span>
                    </div>
                  </div>
                ) : user.user_type_info.capabilities && user.user_type_info.capabilities.length > 0 ? (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <ShieldCheck size={12} aria-hidden="true" />
                      Capabilities
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {user.user_type_info.capabilities.slice(0, 5).map((cap) => (
                        <Badge key={cap} variant="outline" size="sm">
                          {cap.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {user.user_type_info.capabilities.length > 5 && (
                        <Badge variant="secondary" size="sm">
                          +{user.user_type_info.capabilities.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : null)}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card padding="lg" className="lg:col-span-3">
          <CardHeader>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Activity size={18} aria-hidden="true" />
              User Statistics
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              {/* Projects */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted-subtle">
                <div className="h-10 w-10 rounded-lg bg-info-subtle flex items-center justify-center">
                  <FolderKanban size={20} className="text-info-subtle-foreground" aria-hidden="true" />
                </div>
                <span className="text-2xl font-semibold tabular-nums">{stats.total_accessible_projects}</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projects</span>
              </div>
              {/* Groups */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted-subtle">
                <div className="h-10 w-10 rounded-lg bg-purple-subtle flex items-center justify-center">
                  <Users size={20} className="text-purple-subtle-foreground" aria-hidden="true" />
                </div>
                <span className="text-2xl font-semibold tabular-nums">{stats.total_groups}</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Groups</span>
              </div>
              {/* Permissions */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted-subtle">
                <div className="h-10 w-10 rounded-lg bg-success-subtle flex items-center justify-center">
                  <Lock size={20} className="text-success-subtle-foreground" aria-hidden="true" />
                </div>
                <span className="text-2xl font-semibold tabular-nums">{stats.total_permissions}</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Permissions</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global Permissions Card */}
        {(globalRole || permissionSources || isGlobalDataLoading) && (
          <Card padding="lg" className="lg:col-span-3">
            <CardHeader>
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <ShieldCheck size={18} aria-hidden="true" />
                Global Permissions
              </h3>
            </CardHeader>
            <CardContent>
              {isGlobalDataLoading ? (
                <div className="space-y-4">
                  <Skeleton variant="text" count={3} />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Global Role */}
                  {globalRole && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Global Role</h4>
                      <div className="flex items-start gap-4">
                        <Badge variant="primary" size="lg">
                          {globalRole.role_display_name}
                        </Badge>
                        <div className="flex-1 space-y-1">
                          {globalRole.role_description && (
                            <p className="text-sm text-muted-foreground">{globalRole.role_description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Priority: {globalRole.role_priority}</span>
                            {globalRole.is_system_role && (
                              <Badge variant="secondary" size="sm">System Role</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Permission Sources */}
                  {permissionSources && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Permission Sources</h4>
                      <div className="grid gap-4 sm:grid-cols-3">
                        {/* From Role */}
                        <div className="space-y-2 p-4 rounded-lg bg-muted-subtle border border-border">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-primary-subtle flex items-center justify-center">
                              <ShieldCheck size={16} className="text-primary-subtle-foreground" aria-hidden="true" />
                            </div>
                            <span className="text-sm font-medium">From Role</span>
                          </div>
                          <p className="text-2xl font-semibold tabular-nums">{permissionSources.from_role.length}</p>
                          {permissionSources.from_role.length > 0 && (
                            <div className="space-y-1">
                              {permissionSources.from_role.slice(0, 3).map((source, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Badge variant="secondary" size="sm">{source.permission_group_name}</Badge>
                                  <span className="text-xs text-muted-foreground">{source.permissions_count} perms</span>
                                </div>
                              ))}
                              {permissionSources.from_role.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{permissionSources.from_role.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* From Groups */}
                        <div className="space-y-2 p-4 rounded-lg bg-muted-subtle border border-border">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-purple-subtle flex items-center justify-center">
                              <Users size={16} className="text-purple-subtle-foreground" aria-hidden="true" />
                            </div>
                            <span className="text-sm font-medium">From Groups</span>
                          </div>
                          <p className="text-2xl font-semibold tabular-nums">{permissionSources.from_user_groups.length}</p>
                          {permissionSources.from_user_groups.length > 0 && (
                            <div className="space-y-1">
                              {permissionSources.from_user_groups.slice(0, 3).map((source, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Badge variant="info" size="sm">{source.user_group_name}</Badge>
                                  <span className="text-xs text-muted-foreground">{source.permissions_count} perms</span>
                                </div>
                              ))}
                              {permissionSources.from_user_groups.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{permissionSources.from_user_groups.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Direct Assignment */}
                        <div className="space-y-2 p-4 rounded-lg bg-muted-subtle border border-border">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-success-subtle flex items-center justify-center">
                              <Zap size={16} className="text-success-subtle-foreground" aria-hidden="true" />
                            </div>
                            <span className="text-sm font-medium">Direct Assignment</span>
                          </div>
                          <p className="text-2xl font-semibold tabular-nums">{permissionSources.from_direct_assignment.length}</p>
                          {permissionSources.from_direct_assignment.length > 0 && (
                            <div className="space-y-1">
                              {permissionSources.from_direct_assignment.slice(0, 3).map((source, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Badge variant="success" size="sm">{source.permission_group_name}</Badge>
                                  <span className="text-xs text-muted-foreground">{source.permissions_count} perms</span>
                                </div>
                              ))}
                              {permissionSources.from_direct_assignment.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{permissionSources.from_direct_assignment.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Assigned Projects Card */}
        <Card padding="lg" className="lg:col-span-3">
          <CardHeader>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <FolderKanban size={18} aria-hidden="true" />
              Assigned Projects ({userProjects.length})
            </h3>
          </CardHeader>
          <CardContent>
            {userProjects.length > 0 ? (
              <div className="space-y-4">
                {userProjects.map((project) => (
                  <div 
                    key={project.project_hash} 
                    className="p-4 rounded-lg bg-muted-subtle border border-border space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">{project.project_name}</h4>
                        {project.project_description && (
                          <p className="text-sm text-muted-foreground">{project.project_description}</p>
                        )}
                        <p className="text-xs font-mono text-muted-foreground">ID: {project.project_hash}</p>
                      </div>
                      <Badge variant="info" size="sm">
                        {project.effective_permissions.length} permissions
                      </Badge>
                    </div>

                    {/* Access Groups */}
                    {project.access_groups && project.access_groups.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Access Groups</label>
                        <div className="flex flex-wrap gap-2">
                          {project.access_groups.map((group: any) => (
                            <div 
                              key={group.group_hash} 
                              className="flex items-center gap-2 px-2 py-1 rounded-md bg-purple-subtle"
                            >
                              <span className="text-sm font-medium text-purple-subtle-foreground">{group.group_name}</span>
                              {group.permission_group_count !== undefined && (
                                <span className="text-xs text-muted-foreground">{group.permission_group_count} groups</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Effective Permissions */}
                    {project.effective_permissions && project.effective_permissions.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Effective Permissions</label>
                        <div className="flex flex-wrap gap-1.5">
                          {project.effective_permissions.slice(0, 8).map((permission, permIndex) => (
                            <Badge key={permIndex} variant="secondary" size="sm">
                              {permission}
                            </Badge>
                          ))}
                          {project.effective_permissions.length > 8 && (
                            <Badge variant="outline" size="sm">
                              +{project.effective_permissions.length - 8} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FolderKanban size={32} />}
                title="No Projects Assigned"
                description="This user doesn't have any projects assigned yet."
                size="sm"
              />
            )}
          </CardContent>
        </Card>

        {/* User Groups Card */}
        <Card padding="lg" className="lg:col-span-3">
          <CardHeader>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Users size={18} aria-hidden="true" />
              User Groups ({userGroups.length})
            </h3>
          </CardHeader>
          <CardContent>
            {userGroups.length > 0 ? (
              <div className="space-y-4">
                {userGroups.map((group) => (
                  <div 
                    key={group.group_hash} 
                    className="p-4 rounded-lg bg-muted-subtle border border-border space-y-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">{group.group_name}</h4>
                        {group.group_description && (
                          <p className="text-sm text-muted-foreground">{group.group_description}</p>
                        )}
                      </div>
                      <Badge variant="info" size="sm">
                        {group.projects_count} projects
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">ID: {group.group_hash}</span>
                      <span>Assigned: {formatDateTime(group.assigned_at)}</span>
                      {group.assigned_by && <span>By: {group.assigned_by}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Users size={32} />}
                title="No Group Memberships"
                description="This user isn't a member of any groups yet."
                size="sm"
              />
            )}
          </CardContent>
        </Card>

        {/* Direct Permission Groups Management */}
        <div className="lg:col-span-3">
          <UserPermissionGroupsTab
            userHash={user.user_hash}
            username={user.username}
          />
        </div>

        {/* All Permissions Card */}
        <Card padding="lg" className="lg:col-span-3">
          <CardHeader>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Lock size={18} aria-hidden="true" />
              All Permissions ({permissions.length})
            </h3>
          </CardHeader>
          <CardContent>
            {permissions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {permissions.map((permission, index) => (
                  <Badge key={index} variant="info" size="sm">
                    {permission}
                  </Badge>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Lock size={32} />}
                title="No Permissions Assigned"
                description="This user doesn't have any specific permissions assigned."
                size="sm"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default UserProfilePage;