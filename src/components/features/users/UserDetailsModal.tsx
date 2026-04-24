import React from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from './UserAvatar';
import { Pencil, Users, FolderKanban, Clock, Shield, AlertTriangle, Calendar, Activity, ExternalLink } from 'lucide-react';
import { formatDateTime, getUserTypeBadgeVariant, truncateHash } from '@/utils/component-utils';
import type { User } from '@/types/auth.types';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onEdit?: () => void;
}

// Helper to calculate account age
function getAccountAge(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) return 'Today';
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)} years`;
}

export function UserDetailsModal({
  isOpen,
  onClose,
  user,
  onEdit
}: UserDetailsModalProps): React.JSX.Element {
  if (!user) return <></>;

  const accountAge = getAccountAge(user.created_at);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={18} aria-hidden="true" />
            Quick Overview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* User Identity Section */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
            <UserAvatar 
              username={user.username} 
              userType={user.user_type}
              size="lg"
            />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate">{user.username}</h3>
              <p className="text-xs text-muted-foreground truncate" title={user.user_hash}>
                {truncateHash(user.user_hash)}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getUserTypeBadgeVariant(user.user_type)} size="sm">
                  {user.user_type.toUpperCase()}
                </Badge>
                <Badge variant={user.is_active ? 'success' : 'secondary'} size="sm">
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Account Age */}
            <div className="flex items-center gap-2 p-3 rounded-md bg-background border">
              <Calendar size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-muted-foreground">Account Age</span>
                <span className="text-sm font-medium truncate">{accountAge}</span>
              </div>
            </div>

            {/* Last Login */}
            <div className="flex items-center gap-2 p-3 rounded-md bg-background border">
              <Activity size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-muted-foreground">Last Login</span>
                <span className="text-sm font-medium truncate">
                  {user.last_login ? formatDateTime(user.last_login) : 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact & Account Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-md bg-background border">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground shrink-0">Email</span>
              </div>
              <span className="text-sm truncate" title={user.email || 'Not provided'}>
                {user.email || 'Not provided'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-background border">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-muted-foreground" aria-hidden="true" />
                <span className="text-xs text-muted-foreground">Created</span>
              </div>
              <span className="text-sm">{formatDateTime(user.created_at)}</span>
            </div>
            {user.updated_at && (
              <div className="flex items-center justify-between p-3 rounded-md bg-background border">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-muted-foreground" aria-hidden="true" />
                  <span className="text-xs text-muted-foreground">Updated</span>
                </div>
                <span className="text-sm">{formatDateTime(user.updated_at)}</span>
              </div>
            )}
          </div>

          {/* Groups Summary */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Users size={16} aria-hidden="true" />
              Groups
              <Badge variant="secondary" size="sm">{user.groups?.length || 0}</Badge>
            </h4>
            {user.groups && user.groups.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {user.groups.slice(0, 4).map(group => (
                  <Badge key={group.group_hash} variant="secondary" size="sm">
                    {group.group_name}
                  </Badge>
                ))}
                {user.groups.length > 4 && (
                  <Badge variant="outline" size="sm">
                    +{user.groups.length - 4} more
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No groups assigned</p>
            )}
          </div>

          {/* Projects Summary */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FolderKanban size={16} aria-hidden="true" />
              Projects
              <Badge variant="info" size="sm">{user.projects?.length || 0}</Badge>
            </h4>
            {user.projects && user.projects.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {user.projects.slice(0, 4).map(project => (
                  <Badge key={project.project_hash} variant="info" size="sm">
                    {project.project_name}
                  </Badge>
                ))}
                {user.projects.length > 4 && (
                  <Badge variant="outline" size="sm">
                    +{user.projects.length - 4} more
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No project access</p>
            )}
          </div>

          {/* User Type Capabilities (if available) */}
          {user.user_type_info && !user.user_type_info.error && user.user_type_info.capabilities && user.user_type_info.capabilities.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Shield size={16} aria-hidden="true" />
                Key Capabilities
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {user.user_type_info.capabilities.slice(0, 4).map(capability => (
                  <Badge key={capability} variant="outline" size="sm">
                    {capability.replace(/_/g, ' ').toLowerCase()}
                  </Badge>
                ))}
                {user.user_type_info.capabilities.length > 4 && (
                  <Badge variant="outline" size="sm">
                    +{user.user_type_info.capabilities.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Error Warning (if applicable) */}
          {user.user_type_info?.error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <AlertTriangle size={16} className="text-destructive mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-sm text-destructive">{user.user_type_info.error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {/* View Full Profile Link */}
          <Link
            to={`/users/${user.user_hash}`}
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 w-full sm:w-auto"
          >
            <ExternalLink size={16} aria-hidden="true" />
            View Full Profile
          </Link>
          {onEdit && (
            <Button variant="outline" onClick={onEdit} className="w-full sm:w-auto">
              <Pencil size={16} aria-hidden="true" />
              Edit
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UserDetailsModal;