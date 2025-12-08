import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PageContainer,
  PageHeader,
  Button,
  Card,
  CardContent
} from '@/components/common';
import { ProjectGroupForm } from '@/components/features/groups';
import { useProjectGroups, useToast } from '@/hooks';
import { FolderOpen, ArrowLeft } from 'lucide-react';
import type { CreateProjectGroupRequest } from '@/services/project-group.service';

export function ProjectGroupCreatePage(): React.JSX.Element {
  const navigate = useNavigate();
  const { createProjectGroup } = useProjectGroups();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateProjectGroupRequest) => {
    setIsLoading(true);
    try {
      await createProjectGroup(data);
      showToast(`Project group "${data.group_name}" created successfully`, 'success');
      navigate('/dashboard/groups/project-groups');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create project group', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/groups/project-groups');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create Project Group"
        subtitle="Create a new project group to organize related projects together"
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
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}

export default ProjectGroupCreatePage; 