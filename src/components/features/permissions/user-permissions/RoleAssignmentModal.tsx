import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Search, User, Check, X, Shield, ArrowRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobalRoles } from '@/hooks';
import type { GlobalRole } from '@/types/global-roles.types';

interface UserForAssignment {
  user_hash: string;
  username: string;
  email: string;
  user_type: string;
  current_role?: string;
}

interface RoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserForAssignment[];
  onAssignRole: (userHash: string, roleHash: string) => Promise<void>;
  isLoading?: boolean;
}

export function RoleAssignmentModal({
  isOpen,
  onClose,
  users,
  onAssignRole,
  isLoading = false
}: RoleAssignmentModalProps): React.JSX.Element {
  const { roles, loadingRoles } = useGlobalRoles();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserForAssignment | null>(null);
  const [selectedRole, setSelectedRole] = useState<GlobalRole | null>(null);
  const [assignmentInProgress, setAssignmentInProgress] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setRoleSearchQuery('');
      setSelectedUser(null);
      setSelectedRole(null);
      setCurrentStep(1);
    }
  }, [isOpen]);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRoles = roles.filter(role =>
    role.role_name.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
    role.role_display_name.toLowerCase().includes(roleSearchQuery.toLowerCase())
  );

  const handleUserSelect = (user: UserForAssignment) => {
    setSelectedUser(user);
    setCurrentStep(2);
  };

  const handleRoleSelect = (role: GlobalRole) => {
    setSelectedRole(role);
    setCurrentStep(3);
  };

  const handleAssign = async () => {
    if (!selectedUser || !selectedRole) return;

    setAssignmentInProgress(true);
    try {
      await onAssignRole(selectedUser.user_hash, selectedRole.role_hash);
      setSearchQuery('');
      setRoleSearchQuery('');
      setSelectedUser(null);
      setSelectedRole(null);
      setCurrentStep(1);
    } catch (error) {
      console.error('Failed to assign role:', error);
    } finally {
      setAssignmentInProgress(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setSelectedUser(null);
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setSelectedRole(null);
      setCurrentStep(2);
    }
  };

  const getPriorityLevel = (priority: number): { level: string; color: 'destructive' | 'warning' | 'info' | 'secondary' } => {
    if (priority >= 900) return { level: 'Critical', color: 'destructive' };
    if (priority >= 700) return { level: 'High', color: 'warning' };
    if (priority >= 400) return { level: 'Medium', color: 'info' };
    return { level: 'Low', color: 'secondary' };
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Assign Global Role to User</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {currentStep > 1 ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <span className="text-sm font-medium">Select User</span>
            </div>
            <div className="h-px flex-1 bg-border mx-4" />
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {currentStep > 2 ? <Check className="h-4 w-4" /> : '2'}
              </div>
              <span className="text-sm font-medium">Choose Role</span>
            </div>
            <div className="h-px flex-1 bg-border mx-4" />
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                currentStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                3
              </div>
              <span className="text-sm font-medium">Confirm</span>
            </div>
          </div>

          {/* Step Content */}
          <div>
            {/* Step 1: Select User */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Select a User</h3>
                  <p className="text-sm text-muted-foreground">Choose the user you want to assign a role to</p>
                </div>
                
                <Input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  fullWidth
                />

                <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-2">
                  {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <User className="h-10 w-10 mb-2" />
                      <p>No users found</p>
                    </div>
                  ) : (
                    filteredUsers.map(user => (
                      <div
                        key={user.user_hash}
                        className="flex items-center gap-3 p-3 rounded-md hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{user.username}</div>
                          <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{user.user_type}</Badge>
                          {user.current_role && (
                            <Badge variant="info">Current: {user.current_role}</Badge>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Select Role */}
            {currentStep === 2 && selectedUser && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Choose a Role</h3>
                  <p className="text-sm text-muted-foreground">
                    Select the role to assign to <strong>{selectedUser.username}</strong>
                  </p>
                </div>

                {selectedUser.current_role && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-info/10 text-info">
                    <Info className="h-4 w-4" />
                    <span className="text-sm">Current role: <strong>{selectedUser.current_role}</strong> (will be replaced)</span>
                  </div>
                )}
                
                <Input
                  type="text"
                  placeholder="Search roles..."
                  value={roleSearchQuery}
                  onChange={(e) => setRoleSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  fullWidth
                />
                
                <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-2">
                  {loadingRoles ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Spinner size="lg" />
                      <p className="text-sm text-muted-foreground mt-2">Loading roles...</p>
                    </div>
                  ) : filteredRoles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Shield className="h-10 w-10 mb-2" />
                      <p>No roles available</p>
                    </div>
                  ) : (
                    filteredRoles.map(role => {
                      const priorityInfo = getPriorityLevel(role.role_priority);
                      return (
                        <div
                          key={role.role_hash}
                          className="flex items-center gap-3 p-3 rounded-md hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => handleRoleSelect(role)}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Shield className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{role.role_display_name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {role.role_description || role.role_name}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={priorityInfo.color}>
                              {priorityInfo.level}
                            </Badge>
                            {role.is_system_role && (
                              <Badge variant="info">System</Badge>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Confirm Assignment */}
            {currentStep === 3 && selectedUser && selectedRole && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Confirm Assignment</h3>
                  <p className="text-sm text-muted-foreground">Review the details before confirming</p>
                </div>

                <div className="flex items-center gap-4 justify-center py-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">User</p>
                    <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                      <User className="h-8 w-8 text-muted-foreground" />
                      <div className="font-medium">{selectedUser.username}</div>
                      <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                    </div>
                  </div>

                  <ArrowRight className="h-6 w-6 text-muted-foreground" />

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">New Role</p>
                    <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                      <Shield className="h-8 w-8 text-primary" />
                      <div className="font-medium">{selectedRole.role_display_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Priority: {selectedRole.role_priority}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedUser.current_role && selectedUser.current_role !== selectedRole.role_name && (
                  <div className="flex items-start gap-3 p-4 rounded-md bg-warning/10 border border-warning/20">
                    <span className="text-lg">Warning</span>
                    <div className="text-sm">
                      <strong>Role Replacement</strong>
                      <p className="text-muted-foreground mt-1">
                        The current role "<strong>{selectedUser.current_role}</strong>" will be replaced 
                        with "<strong>{selectedRole.role_display_name}</strong>". This action cannot be undone.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <div>
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={assignmentInProgress || isLoading}
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  Back
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {currentStep === 3 && (
                <Button
                  variant="primary"
                  onClick={handleAssign}
                  disabled={assignmentInProgress || isLoading}
                  loading={assignmentInProgress}
                >
                  <Check className="h-4 w-4" />
                  Confirm Assignment
                </Button>
              )}

              <Button
                variant="outline"
                onClick={onClose}
                disabled={assignmentInProgress || isLoading}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RoleAssignmentModal;
