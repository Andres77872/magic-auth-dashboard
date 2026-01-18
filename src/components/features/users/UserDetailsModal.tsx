import React from 'react';
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
import { Pencil, Users, FolderKanban, Clock, Shield, AlertTriangle } from 'lucide-react';
import { formatDateTime, getUserTypeBadgeVariant, truncateHash } from '@/utils/component-utils';
import type { User } from '@/types/auth.types';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onEdit?: () => void;
}

export function UserDetailsModal({
  isOpen,
  onClose,
  user,
  onEdit
}: UserDetailsModalProps): React.JSX.Element {
  if (!user) return <></>;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-center gap-4">
            <UserAvatar 
              username={user.username} 
              userType={user.user_type}
              size="lg"
            />
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold">{user.username}</h3>
              <p className="text-sm text-muted-foreground">{truncateHash(user.user_hash)}</p>
              <div className="flex items-center gap-2">
                <Badge variant={getUserTypeBadgeVariant(user.user_type)}>
                  {user.user_type.toUpperCase()}
                </Badge>
                <Badge variant={user.is_active ? 'success' : 'secondary'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Contact Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Email</span>
                <p className="text-sm">{user.email || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Created At</span>
                <p className="flex items-center gap-1 text-sm">
                  <Clock size={14} />
                  {formatDateTime(user.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Groups */}
          {user.groups && user.groups.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Users size={16} aria-hidden="true" />
                Groups ({user.groups.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {user.groups.map(group => (
                  <Badge key={group.group_hash} variant="secondary">
                    {group.group_name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {user.projects && user.projects.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FolderKanban size={16} aria-hidden="true" />
                Projects ({user.projects.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {user.projects.map(project => (
                  <Badge key={project.project_hash} variant="outline">
                    {project.project_name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* User Type Info */}
          {user.user_type_info && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Shield size={16} aria-hidden="true" />
                User Type Information
              </h4>
              {user.user_type_info.error ? (
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3">
                  <AlertTriangle size={16} className="text-destructive mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-sm text-destructive">{user.user_type_info.error}</p>
                </div>
              ) : user.user_type_info.capabilities && user.user_type_info.capabilities.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">Capabilities</span>
                  <div className="flex flex-wrap gap-1.5">
                    {user.user_type_info.capabilities.map(capability => (
                      <Badge key={capability} variant="outline" size="sm">
                        {capability.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground rounded-md bg-muted p-3">
                  No additional capabilities defined
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {onEdit && (
            <Button onClick={onEdit}>
              <Pencil size={16} aria-hidden="true" />
              Edit User
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UserDetailsModal;

