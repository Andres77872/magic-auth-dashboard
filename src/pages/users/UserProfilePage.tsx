import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Badge, Skeleton, EmptyState, Button } from '@/components/common';
import { UserPermissionGroupsTab } from '@/components/features/users/UserPermissionGroupsTab';
import { userService, globalRolesService, permissionAssignmentsService } from '@/services';
import { ROUTES } from '@/utils/routes';
import { User, XCircle, RefreshCw, Pencil, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import type { UserType, UserProfileResponse } from '@/types/auth.types';
import type { GlobalRole } from '@/types/global-roles.types';
import type { PermissionSource } from '@/types/permission-assignments.types';

export function UserProfilePage(): React.JSX.Element {
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalRole, setGlobalRole] = useState<GlobalRole | null>(null);
  const [permissionSources, setPermissionSources] = useState<{
    from_role: PermissionSource[];
    from_user_groups: PermissionSource[];
    from_direct_assignment: PermissionSource[];
  } | null>(null);
  const [loadingGlobalData, setLoadingGlobalData] = useState(false);
  const navigate = useNavigate();
  const { userHash } = useParams<{ userHash: string }>();

  useEffect(() => {
    if (userHash) {
      fetchUser(userHash);
    } else {
      setError('User ID is required');
      setIsLoading(false);
    }
  }, [userHash]);

  const fetchUser = async (hash: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await userService.getUserByHash(hash);

      if (response.success && response.user) {
        // The response already matches UserProfileResponse structure
        // Calculate statistics from user data if not provided
        const userGroups = response.user.groups || [];
        const userProjects = response.user.projects || [];
        const allPermissions = userProjects.flatMap(project => project.effective_permissions || []);
        const accountAgeMs = new Date().getTime() - new Date(response.user.created_at).getTime();
        const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

        // Use statistics from API if available, otherwise calculate
        const calculatedStatistics = {
          total_groups: userGroups.length,
          total_accessible_projects: userProjects.length,
          total_permissions: allPermissions.length,
          account_age_days: accountAgeDays,
        };

        const finalResponse: UserProfileResponse = {
          ...response,
          statistics: response.statistics || calculatedStatistics,
          permissions: response.permissions || allPermissions,
        };

        setProfileData(finalResponse);
        
        // Fetch global role and permission sources
        fetchGlobalRoleData(hash);
      } else {
        setError(response.message || 'Failed to fetch user data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlobalRoleData = async (hash: string) => {
    setLoadingGlobalData(true);
    try {
      // Fetch user's global role
      const roleResponse = await globalRolesService.getUserRole(hash);
      if (roleResponse.success && roleResponse.data) {
        setGlobalRole(roleResponse.data);
      }
    } catch (err) {
      console.error('Failed to fetch global role:', err);
      // Non-critical error, don't show to user
    }

    try {
      // Fetch permission sources (only for current user endpoint available)
      // If viewing own profile, fetch sources
      const sourcesResponse = await permissionAssignmentsService.getMyPermissionSources();
      if (sourcesResponse.success && sourcesResponse.data) {
        setPermissionSources(sourcesResponse.data);
      }
    } catch (err) {
      console.error('Failed to fetch permission sources:', err);
      // Non-critical error, don't show to user
    } finally {
      setLoadingGlobalData(false);
    }
  };

  const handleGoBack = () => {
    navigate(ROUTES.USERS);
  };

  const handleEditUser = () => {
    if (userHash) {
      navigate(`${ROUTES.USERS_EDIT}/${userHash}`);
    }
  };

  const getUserTypeBadgeVariant = (userType: UserType) => {
    switch (userType) {
      case 'root':
        return 'error';
      case 'admin':
        return 'warning';
      case 'consumer':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="user-profile-page">
        <div className="page-header">
          <div className="page-title-section">
            <button onClick={handleGoBack} className="back-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
              Back to Users
            </button>
            <h1>User Profile</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="profile-grid">
            <Card padding="lg">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton variant="avatar-lg" />
                <div className="flex-1">
                  <Skeleton variant="title" width="40%" />
                  <Skeleton variant="text" width="30%" />
                </div>
              </div>
              <div className="user-details-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="detail-item">
                    <Skeleton variant="text" width="50%" />
                  </div>
                ))}
              </div>
            </Card>
            <Card padding="lg">
              <Skeleton variant="title" />
              <Skeleton variant="line" count={4} />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="user-profile-page">
        <div className="page-header">
          <div className="page-title-section">
            <button onClick={handleGoBack} className="back-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
              Back to Users
            </button>
            <h1>User Profile</h1>
          </div>
        </div>
        <div className="page-content">
          <EmptyState
            icon={<XCircle size={32} />}
            title="Failed to Load User Profile"
            description={error}
            action={
              <Button 
                onClick={() => userHash && fetchUser(userHash)}
                variant="primary"
                leftIcon={<RefreshCw size={16} aria-hidden="true" />}
                aria-label="Retry loading user profile"
              >
                Try Again
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  if (!profileData || !profileData.user) {
    return (
      <div className="user-profile-page">
        <div className="page-header">
          <div className="page-title-section">
            <button onClick={handleGoBack} className="back-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
              Back to Users
            </button>
            <h1>User Profile</h1>
          </div>
        </div>
        <div className="page-content">
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
        </div>
      </div>
    );
  }

  const { user, permissions, statistics } = profileData;
  const userGroups = user.groups || [];
  const userProjects = user.projects || [];

  // Provide default statistics when API returns null to avoid runtime errors
  const defaultStatistics = {
    total_groups: 0,
    total_accessible_projects: 0,
    total_permissions: 0,
    account_age_days: 0,
  };
  const stats = statistics ?? defaultStatistics;

  return (
    <div className="user-profile-page">
      <div className="page-header">
        <div className="page-title-section">
          <button onClick={handleGoBack} className="back-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
            Back to Users
          </button>
          <h1>User Profile</h1>
          <p>Detailed information about {user.username}</p>
        </div>
        <div className="page-actions">
          <Button 
            onClick={handleEditUser}
            variant="primary"
            leftIcon={<Pencil size={16} aria-hidden="true" />}
            aria-label="Edit user profile"
          >
            Edit User
          </Button>
        </div>
      </div>

      <div className="page-content">
        <div className="profile-grid">
          {/* User Information Card */}
          <Card title="User Information" padding="lg">
            <div className="user-profile-info">
                          <div className="profile-user-avatar-section">
              <div className="profile-user-avatar-large">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="avatar-info">
                  <h2>{user.username}</h2>
                  <Badge
                    variant={getUserTypeBadgeVariant(user.user_type)}
                    size="md"
                  >
                    {user.user_type.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="user-details-grid">
                <div className="detail-item">
                  <label>Email Address</label>
                  <span>{user.email || 'Not provided'}</span>
                </div>

                <div className="detail-item">
                  <label>User Hash</label>
                  <span className="user-hash">{user.user_hash}</span>
                </div>

                <div className="detail-item">
                  <label>Account Status</label>
                  <Badge variant={user.is_active ? 'success' : 'secondary'} size="sm" dot>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="detail-item">
                  <label>Created At</label>
                  <span>{formatDate(user.created_at)}</span>
                </div>

                {user.updated_at && (
                  <div className="detail-item">
                    <label>Last Updated</label>
                    <span>{formatDate(user.updated_at)}</span>
                  </div>
                )}

                {user.last_login && (
                  <div className="detail-item">
                    <label>Last Login</label>
                    <span>{formatDate(user.last_login)}</span>
                  </div>
                )}

                <div className="detail-item">
                  <label>Account Age</label>
                  <span>{stats.account_age_days} days</span>
                </div>

                {/* User Type Info Error */}
                {user.user_type_info?.error && (
                  <div className="detail-item">
                    <label>User Type Error</label>
                    <span className="error-text">{user.user_type_info.error}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Statistics Card */}
          <Card title="User Statistics" padding="lg">
            <div className="statistics-grid">
              <div className="statistic-item">
                <div className="statistic-value">{stats.total_accessible_projects}</div>
                <div className="statistic-label">Projects</div>
              </div>
              <div className="statistic-item">
                <div className="statistic-value">{stats.total_groups}</div>
                <div className="statistic-label">Groups</div>
              </div>
              <div className="statistic-item">
                <div className="statistic-value">{stats.total_permissions}</div>
                <div className="statistic-label">Permissions</div>
              </div>
            </div>
          </Card>

          {/* Global Role Card */}
          {globalRole || permissionSources ? (
            <Card title="Global Permissions" padding="lg">
              <div className="global-permissions-section">
                {/* Global Role */}
                {globalRole && (
                  <div className="global-role-info">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck size={20} />
                      <h3 className="font-semibold">Global Role</h3>
                    </div>
                    <div className="role-display">
                      <Badge variant="primary" size="lg">
                        {globalRole.role_display_name}
                      </Badge>
                      {globalRole.role_description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {globalRole.role_description}
                        </p>
                      )}
                      <div className="role-meta mt-2 text-xs text-muted-foreground">
                        <span>Priority: {globalRole.role_priority}</span>
                        {globalRole.is_system_role && (
                          <Badge variant="secondary" size="sm" className="ml-2">
                            System Role
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Permission Sources */}
                {permissionSources && (
                  <div className="permission-sources mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock size={20} />
                      <h3 className="font-semibold">Permission Sources</h3>
                    </div>
                    <div className="sources-grid">
                      <div className="source-card">
                        <div className="source-header">
                          <span className="source-icon">🛡️</span>
                          <span className="source-label">From Role</span>
                        </div>
                        <div className="source-count">{permissionSources.from_role.length}</div>
                        <div className="source-details">
                          {permissionSources.from_role.slice(0, 3).map((source, idx) => (
                            <div key={idx} className="source-item">
                              <Badge variant="secondary" size="sm">
                                {source.permission_group_name}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {source.permissions_count} permissions
                              </span>
                            </div>
                          ))}
                          {permissionSources.from_role.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{permissionSources.from_role.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="source-card">
                        <div className="source-header">
                          <span className="source-icon">👥</span>
                          <span className="source-label">From Groups</span>
                        </div>
                        <div className="source-count">{permissionSources.from_user_groups.length}</div>
                        <div className="source-details">
                          {permissionSources.from_user_groups.slice(0, 3).map((source, idx) => (
                            <div key={idx} className="source-item">
                              <Badge variant="info" size="sm">
                                {source.user_group_name}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {source.permissions_count} permissions
                              </span>
                            </div>
                          ))}
                          {permissionSources.from_user_groups.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{permissionSources.from_user_groups.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="source-card">
                        <div className="source-header">
                          <span className="source-icon">⚡</span>
                          <span className="source-label">Direct Assignment</span>
                        </div>
                        <div className="source-count">{permissionSources.from_direct_assignment.length}</div>
                        <div className="source-details">
                          {permissionSources.from_direct_assignment.slice(0, 3).map((source, idx) => (
                            <div key={idx} className="source-item">
                              <Badge variant="success" size="sm">
                                {source.permission_group_name}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {source.permissions_count} permissions
                              </span>
                            </div>
                          ))}
                          {permissionSources.from_direct_assignment.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{permissionSources.from_direct_assignment.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {loadingGlobalData && (
                  <div className="loading-global-data">
                    <Skeleton variant="text" count={3} />
                  </div>
                )}
              </div>
            </Card>
          ) : loadingGlobalData ? (
            <Card title="Global Permissions" padding="lg">
              <Skeleton variant="text" count={5} />
            </Card>
          ) : null}

          {/* Projects Section */}
          <Card title={`Assigned Projects (${userProjects.length})`} padding="lg">
            {userProjects.length > 0 ? (
              <div className="projects-list">
                {userProjects.map((project) => (
                  <div key={project.project_hash} className="project-item">
                    <div className="project-header">
                      <h4>{project.project_name}</h4>
                      <Badge variant="info" size="sm">
                        {project.effective_permissions.length} permissions
                      </Badge>
                    </div>
                    {project.project_description && (
                      <p className="project-description">{project.project_description}</p>
                    )}
                    <div className="project-meta">
                      <span className="project-hash">ID: {project.project_hash}</span>
                    </div>
                    
                    {/* Access Groups */}
                    {project.access_groups && project.access_groups.length > 0 && (
                      <div className="project-access-groups">
                        <h5>Access Groups:</h5>
                        <div className="access-groups-list">
                          {project.access_groups.map((group: any) => (
                            <div key={group.group_hash} className="access-group">
                              <span className="group-name">{group.group_name}</span>
                              {group.permission_group_count !== undefined && (
                                <span className="group-permissions">
                                  {group.permission_group_count} permission groups
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Effective Permissions */}
                    {project.effective_permissions && project.effective_permissions.length > 0 && (
                      <div className="project-permissions">
                        <h5>Effective Permissions:</h5>
                        <div className="permissions-list">
                          {project.effective_permissions.map((permission, permIndex) => (
                            <Badge key={permIndex} variant="secondary" size="sm">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="projects-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2l5 0l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <h4>No Projects Assigned</h4>
                <p>This user doesn't have any projects assigned yet.</p>
              </div>
            )}
          </Card>

          {/* Groups Section */}
          <Card title={`User Groups (${userGroups.length})`} padding="lg">
            {userGroups.length > 0 ? (
              <div className="groups-list">
                {userGroups.map((group) => (
                  <div key={group.group_hash} className="group-item">
                    <div className="group-header">
                      <h4>{group.group_name}</h4>
                      <Badge variant="info" size="sm">
                        {group.projects_count} projects
                      </Badge>
                    </div>
                    {group.group_description && (
                      <p className="group-description">{group.group_description}</p>
                    )}
                    <div className="group-meta">
                      <span className="group-hash">ID: {group.group_hash}</span>
                      <span className="group-assigned">
                        Assigned: {formatDate(group.assigned_at)}
                      </span>
                      {group.assigned_by && (
                        <span className="group-assigned-by">
                          By: {group.assigned_by}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="groups-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <h4>No Group Memberships</h4>
                <p>This user isn't a member of any groups yet.</p>
              </div>
            )}
          </Card>

          {/* Direct Permission Groups Management */}
          <UserPermissionGroupsTab
            userHash={user.user_hash}
            username={user.username}
          />

          {/* Permissions Section */}
          <Card title={`All Permissions (${permissions.length})`} padding="lg">
            {permissions.length > 0 ? (
              <div className="permissions-list">
                {permissions.map((permission, index) => (
                  <div key={index} className="permission-item">
                    <Badge variant="info" size="sm">
                      {permission}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="permissions-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                <h4>No Permissions Assigned</h4>
                <p>This user doesn't have any specific permissions assigned.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;