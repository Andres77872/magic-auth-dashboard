import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  PageContainer,
  PageHeader,
  Button,
  Card,
  CardContent,
  LoadingSpinner,
  ErrorState
} from '@/components/common';
import { ProjectGroupForm } from '@/components/features/groups';
import { useProjectGroups, useToast } from '@/hooks';
import { projectGroupService } from '@/services';
import { FolderOpen, ArrowLeft } from 'lucide-react';
import type { CreateProjectGroupRequest, ProjectGroup } from '@/services/project-group.service';

export function ProjectGroupEditPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { groupHash } = useParams<{ groupHash: string }>();
  const { updateProjectGroup } = useProjectGroups();
  const { showToast } = useToast();
  
  const [group, setGroup] = useState<ProjectGroup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupHash) {
        setError('Group hash is required');
        setIsLoadingGroup(false);
        return;
      }

      try {
        setIsLoadingGroup(true);
        const response = await projectGroupService.getProjectGroup(groupHash);
        if (response.success && response.project_group) {
          setGroup(response.project_group);
        } else {
          setError('Failed to load project group');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project group');
      } finally {
        setIsLoadingGroup(false);
      }
    };

    fetchGroup();
  }, [groupHash]);

  const handleSubmit = async (data: CreateProjectGroupRequest) => {
    if (!group) return;

    setIsLoading(true);
    try {
      await updateProjectGroup(group.group_hash, data);
      showToast(`Project group "${data.group_name}" updated successfully`, 'success');
      navigate('/dashboard/groups/project-groups');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update project group', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/groups/project-groups');
  };

  if (isLoadingGroup) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" message="Loading project group..." />
        </div>
      </PageContainer>
    );
  }

  if (error || !group) {
    return (
      <PageContainer>
        <ErrorState
          icon={<FolderOpen size={24} />}
          title="Error Loading Project Group"
          message={error || 'Project group not found'}
          onRetry={() => navigate('/dashboard/groups/project-groups')}
          retryLabel="Back to Project Groups"
          variant="card"
          size="md"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit Project Group"
        subtitle={`Update the details for "${group.group_name}"`}
        icon={<FolderOpen size={28} />}
        actions={
          <Button 
            variant="outline" 
            size="md"
            leftIcon={<ArrowLeft size={16} />}
            onClick={handleCancel}
          >
            Back
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <ProjectGroupForm
            group={group}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}

export default ProjectGroupEditPage; 