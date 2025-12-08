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
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { projectService } from '@/services';
import type { ProjectDetails } from '@/types/project.types';
import type { UserType } from '@/types/auth.types';
import { Search, XCircle, Activity } from 'lucide-react';

interface AssignProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedProjects: string[]) => void;
  initialSelection?: string[];
  isLoading?: boolean;
  userName?: string;
  allowMultiple?: boolean;
  userType?: UserType;
}

export function AssignProjectModal({
  isOpen,
  onClose,
  onConfirm,
  initialSelection = [],
  isLoading = false,
  userName = 'user',
  allowMultiple = true,
  userType = 'consumer'
}: AssignProjectModalProps): React.JSX.Element {
  const [projects, setProjects] = useState<ProjectDetails[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(initialSelection);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const [error, setError] = useState('');

  // Fetch projects when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      setSelectedProjects(initialSelection);
    }
  }, [isOpen, initialSelection]);

  const fetchProjects = async () => {
    setFetchingProjects(true);
    setError('');
    
    try {
      const response = await projectService.getProjects({
        limit: 100, // Get a reasonable number of projects
      });
      
      if (response && Array.isArray(response.projects)) {
        setProjects(response.projects);
      } else {
        setError('Failed to load projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
    } finally {
      setFetchingProjects(false);
    }
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.project_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProjectToggle = (projectHash: string) => {
    setSelectedProjects(prev => {
      if (!allowMultiple) {
        // Single selection mode for consumer users
        return prev.includes(projectHash) ? [] : [projectHash];
      }
      
      // Multiple selection mode for admin users
      if (prev.includes(projectHash)) {
        return prev.filter(hash => hash !== projectHash);
      } else {
        return [...prev, projectHash];
      }
    });
  };

  const handleSelectAll = () => {
    // Only available in multiple selection mode
    if (!allowMultiple) return;
    
    if (selectedProjects.length === filteredProjects.length) {
      // Deselect all filtered projects
      setSelectedProjects(prev => 
        prev.filter(hash => !filteredProjects.some(p => p.project_hash === hash))
      );
    } else {
      // Select all filtered projects
      const allFilteredHashes = filteredProjects.map(p => p.project_hash);
      setSelectedProjects(prev => [
        ...prev.filter(hash => !filteredProjects.some(p => p.project_hash === hash)),
        ...allFilteredHashes
      ]);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedProjects);
  };

  const handleCancel = () => {
    setSelectedProjects(initialSelection);
    setSearchTerm('');
    onClose();
  };

  const selectedCount = selectedProjects.length;
  const allFilteredSelected = filteredProjects.length > 0 && 
    filteredProjects.every(p => selectedProjects.includes(p.project_hash));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && handleCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign {allowMultiple ? 'Projects' : 'Project'} to {userName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header with selection count */}
          <p className="text-sm text-muted-foreground">
            {allowMultiple ? (
              <>{selectedCount} project{selectedCount !== 1 ? 's' : ''} selected</>
            ) : (
              userType === 'consumer' ? (
                selectedCount > 0 ? 'Project selected' : 'Select a project (required)'
              ) : (
                <>{selectedCount} project{selectedCount !== 1 ? 's' : ''} selected</>
              )
            )}
          </p>

          {/* Search and select all */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={fetchingProjects}
                className="pl-9"
              />
            </div>
            
            {allowMultiple && filteredProjects.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={fetchingProjects}
              >
                {allFilteredSelected ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>

          {/* Project list */}
          <div className="max-h-[300px] overflow-y-auto rounded-md border">
            {fetchingProjects ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Spinner size="lg" />
                <p className="mt-2 text-sm text-muted-foreground">Loading projects...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8">
                <XCircle size={32} className="text-destructive" />
                <p className="mt-2 text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchProjects} className="mt-2">
                  Retry
                </Button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Activity size={32} className="text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchTerm ? 'No projects match your search.' : 'No projects available.'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredProjects.map((project) => {
                  const isSelected = selectedProjects.includes(project.project_hash);
                  
                  return (
                    <div
                      key={project.project_hash}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-muted/50',
                        isSelected && 'bg-primary/10'
                      )}
                      onClick={() => handleProjectToggle(project.project_hash)}
                    >
                      {allowMultiple ? (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleProjectToggle(project.project_hash)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                      ) : (
                        <input
                          type="radio"
                          name="project-selection"
                          checked={isSelected}
                          onChange={() => handleProjectToggle(project.project_hash)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                      )}
                      
                      <div className="flex-1 space-y-1">
                        <h4 className="text-sm font-medium">{project.project_name}</h4>
                        {project.project_description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{project.project_description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {project.member_count || 0} member{(project.member_count || 0) !== 1 ? 's' : ''}
                          </span>
                          {project.is_active !== undefined && (
                            <Badge variant={project.is_active ? 'success' : 'secondary'} className="text-xs">
                              {project.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={fetchingProjects || (userType === 'consumer' && selectedCount === 0)}
          >
            {isLoading && <Spinner size="sm" className="mr-2" />}
            {allowMultiple 
              ? `Assign ${selectedCount} Project${selectedCount !== 1 ? 's' : ''}`
              : selectedCount > 0 ? 'Assign Project' : 'Select a Project'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AssignProjectModal; 