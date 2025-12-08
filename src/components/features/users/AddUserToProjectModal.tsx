import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { groupService, projectGroupService } from '@/services';
import type { UserGroup } from '@/types/group.types';
import type { ProjectGroup } from '@/services/project-group.service';
import { Search, Activity } from 'lucide-react';

interface AddUserToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userHash: string;
  userName?: string;
}

export function AddUserToProjectModal({
  isOpen,
  onClose,
  onSuccess,
  userHash,
  userName = 'user'
}: AddUserToProjectModalProps): React.JSX.Element {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedProjectGroup, setSelectedProjectGroup] = useState<string>('');
  const [searchGroupTerm, setSearchGroupTerm] = useState('');
  const [searchProjectGroupTerm, setSearchProjectGroupTerm] = useState('');
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingProjectGroups, setIsLoadingProjectGroups] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'group' | 'projectGroup'>('group');

  // Fetch groups when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      setStep('group');
      setSelectedGroup('');
      setSelectedProjectGroup('');
      setError('');
    }
  }, [isOpen]);

  // Fetch project groups when user group is selected
  useEffect(() => {
    if (selectedGroup && step === 'projectGroup') {
      fetchProjectGroups();
    }
  }, [selectedGroup, step]);

  const fetchGroups = async () => {
    setIsLoadingGroups(true);
    setError('');

    try {
      const response = await groupService.getGroups({ limit: 100 });
      if (response.success && Array.isArray(response.user_groups)) {
        setGroups(response.user_groups);
      } else {
        setError('Failed to load user groups');
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load user groups');
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const fetchProjectGroups = async () => {
    setIsLoadingProjectGroups(true);
    setError('');

    try {
      const response = await projectGroupService.getProjectGroups({ limit: 100 });
      if (response.success && Array.isArray(response.project_groups)) {
        setProjectGroups(response.project_groups);
      } else {
        setError('Failed to load project groups');
      }
    } catch (err) {
      console.error('Error fetching project groups:', err);
      setError('Failed to load project groups');
    } finally {
      setIsLoadingProjectGroups(false);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.group_name.toLowerCase().includes(searchGroupTerm.toLowerCase()) ||
    (group.description || '').toLowerCase().includes(searchGroupTerm.toLowerCase())
  );

  const filteredProjectGroups = projectGroups.filter(pg =>
    pg.group_name.toLowerCase().includes(searchProjectGroupTerm.toLowerCase()) ||
    (pg.description || '').toLowerCase().includes(searchProjectGroupTerm.toLowerCase())
  );

  const handleGroupNext = () => {
    if (selectedGroup) {
      setStep('projectGroup');
    }
  };

  const handleBack = () => {
    setStep('group');
    setSelectedProjectGroup('');
  };

  const handleAdd = async () => {
    if (!selectedGroup || !selectedProjectGroup) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Step 1: Add user to the user group
      await groupService.addMemberToGroup(selectedGroup, { user_hash: userHash });

      // Step 2: Grant user group access to project group (gives access to all projects in the group)
      await groupService.grantProjectGroupAccess(selectedGroup, selectedProjectGroup);

      onSuccess();
      handleCancel();
    } catch (err) {
      console.error('Error adding user to project group:', err);
      setError(err instanceof Error ? err.message : 'Failed to add user to project group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedGroup('');
    setSelectedProjectGroup('');
    setSearchGroupTerm('');
    setSearchProjectGroupTerm('');
    setStep('group');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && handleCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add {userName} to Project via Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step indicator */}
          <p className="text-sm text-muted-foreground">
            Step {step === 'group' ? '1' : '2'} of 2: 
            {step === 'group' ? ' Select a user group' : ' Select a project group'}
          </p>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Group Selection */}
          {step === 'group' && (
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search user groups..."
                  value={searchGroupTerm}
                  onChange={(e) => setSearchGroupTerm(e.target.value)}
                  disabled={isLoadingGroups}
                  className="pl-9"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto rounded-md border">
                {isLoadingGroups ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Spinner size="lg" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading user groups...</p>
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Activity size={24} className="text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {searchGroupTerm ? 'No groups match your search.' : 'No user groups available.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredGroups.map(group => {
                      const isSelected = selectedGroup === group.group_hash;
                      return (
                        <div
                          key={group.group_hash}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-muted/50',
                            isSelected && 'bg-primary/10'
                          )}
                          onClick={() => setSelectedGroup(group.group_hash)}
                        >
                          <input
                            type="radio"
                            name="group-selection"
                            checked={isSelected}
                            onChange={() => setSelectedGroup(group.group_hash)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-1">
                            <h4 className="text-sm font-medium">{group.group_name}</h4>
                            {group.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {group.member_count || 0} member{(group.member_count || 0) !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Project Group Selection */}
          {step === 'projectGroup' && (
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search project groups..."
                  value={searchProjectGroupTerm}
                  onChange={(e) => setSearchProjectGroupTerm(e.target.value)}
                  disabled={isLoadingProjectGroups}
                  className="pl-9"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto rounded-md border">
                {isLoadingProjectGroups ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Spinner size="lg" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading project groups...</p>
                  </div>
                ) : filteredProjectGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Activity size={24} className="text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {searchProjectGroupTerm ? 'No project groups match your search.' : 'No project groups available.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredProjectGroups.map(pg => {
                      const isSelected = selectedProjectGroup === pg.group_hash;
                      return (
                        <div
                          key={pg.group_hash}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-muted/50',
                            isSelected && 'bg-primary/10'
                          )}
                          onClick={() => setSelectedProjectGroup(pg.group_hash)}
                        >
                          <input
                            type="radio"
                            name="project-group-selection"
                            checked={isSelected}
                            onChange={() => setSelectedProjectGroup(pg.group_hash)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-1">
                            <h4 className="text-sm font-medium">{pg.group_name}</h4>
                            {pg.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{pg.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {pg.project_count || 0} project{(pg.project_count || 0) !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {step === 'projectGroup' && (
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          {step === 'group' ? (
            <Button onClick={handleGroupNext} disabled={isLoadingGroups || !selectedGroup}>
              Next
            </Button>
          ) : (
            <Button onClick={handleAdd} disabled={isLoadingProjectGroups || !selectedProjectGroup}>
              {isSubmitting && <Spinner size="sm" className="mr-2" />}
              Grant Access
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddUserToProjectModal;
