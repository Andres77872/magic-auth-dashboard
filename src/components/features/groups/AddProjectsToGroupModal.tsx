import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common';
import { projectGroupService, projectService } from '@/services';
import { useToast } from '@/hooks';
import { FolderOpen, Search, XCircle } from 'lucide-react';

interface AvailableProject {
  project_hash: string;
  project_name: string;
  project_description?: string;
}

interface AddProjectsToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  groupHash: string;
  groupName: string;
  assignedProjectHashes: string[];
}

export function AddProjectsToGroupModal({
  isOpen,
  onClose,
  onSuccess,
  groupHash,
  groupName,
  assignedProjectHashes,
}: AddProjectsToGroupModalProps): React.JSX.Element {
  const { showToast } = useToast();
  const [availableProjects, setAvailableProjects] = useState<AvailableProject[]>([]);
  const [selectedProjectHashes, setSelectedProjectHashes] = useState<string[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAvailableProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const response = await projectService.getProjects({ limit: 500 });
      if (response.success && response.projects) {
        const assignedSet = new Set(assignedProjectHashes);
        setAvailableProjects(
          response.projects.filter((p: AvailableProject) => !assignedSet.has(p.project_hash))
        );
      }
    } catch {
      showToast('Failed to load available projects', 'error');
    } finally {
      setIsLoadingProjects(false);
    }
  }, [assignedProjectHashes, showToast]);

  useEffect(() => {
    if (isOpen) {
      setSelectedProjectHashes([]);
      setSearchTerm('');
      fetchAvailableProjects();
    }
  }, [isOpen, fetchAvailableProjects]);

  const filteredProjects = availableProjects.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.project_name.toLowerCase().includes(term) ||
      (p.project_description?.toLowerCase().includes(term) ?? false)
    );
  });

  const toggleProject = (projectHash: string) => {
    setSelectedProjectHashes(prev =>
      prev.includes(projectHash)
        ? prev.filter(h => h !== projectHash)
        : [...prev, projectHash]
    );
  };

  const handleAssign = async () => {
    if (!groupHash || selectedProjectHashes.length === 0) return;

    setIsAssigning(true);
    let successCount = 0;
    let errorCount = 0;

    for (const projectHash of selectedProjectHashes) {
      try {
        const response = await projectGroupService.assignProjectToGroup(groupHash, projectHash);
        if (response.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0) {
      showToast(`Successfully assigned ${successCount} project(s) to the group`, 'success');
      onSuccess();
    }
    if (errorCount > 0) {
      showToast(`Failed to assign ${errorCount} project(s)`, 'error');
    }

    setIsAssigning(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isAssigning && !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Add Projects to {groupName}</DialogTitle>
          <DialogDescription>
            Select projects to assign to this group. Already-assigned projects are excluded.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={16} />}
              rightIcon={
                searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <XCircle size={16} />
                  </button>
                ) : undefined
              }
              disabled={isLoadingProjects}
              fullWidth
            />
          </div>

          {selectedProjectHashes.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedProjectHashes.length} project{selectedProjectHashes.length !== 1 ? 's' : ''} selected
              </span>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setSelectedProjectHashes([])}
              >
                Clear selection
              </button>
            </div>
          )}

          <div className="max-h-[400px] overflow-y-auto border rounded-md">
            {isLoadingProjects ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" message="Loading projects..." />
              </div>
            ) : filteredProjects.length === 0 ? (
              <EmptyState
                icon={<FolderOpen size={32} />}
                title={searchTerm ? 'No projects found' : 'No available projects'}
                description={
                  searchTerm
                    ? 'Try adjusting your search criteria'
                    : 'All projects are already assigned to this group'
                }
              />
            ) : (
              <div className="divide-y">
                {filteredProjects.map(project => (
                  <div
                    key={project.project_hash}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                      selectedProjectHashes.includes(project.project_hash)
                        ? 'bg-primary/5'
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => toggleProject(project.project_hash)}
                  >
                    <Checkbox
                      checked={selectedProjectHashes.includes(project.project_hash)}
                      onCheckedChange={() => toggleProject(project.project_hash)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{project.project_name}</div>
                      {project.project_description && (
                        <div className="text-sm text-muted-foreground truncate">
                          {project.project_description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAssign}
            disabled={selectedProjectHashes.length === 0 || isAssigning}
            loading={isAssigning}
          >
            Add {selectedProjectHashes.length > 0 ? `(${selectedProjectHashes.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddProjectsToGroupModal;
