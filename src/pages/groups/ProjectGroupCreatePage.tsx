import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/common/PageContainer';
import { groupRoutes } from '@/components/features/groups';
import { ProjectGroupsListView } from './components/ProjectGroupsListView';

/**
 * `/groups/project-groups/create` (kept for old links): the project group list
 * with the create dialog open. Closing it returns to the list; creating a group
 * opens its details.
 */
export function ProjectGroupCreatePage(): React.JSX.Element {
  const navigate = useNavigate();
  return (
    <PageContainer>
      <ProjectGroupsListView
        startWithCreate
        onCreateDismiss={() =>
          void navigate(groupRoutes.projectGroupList, { replace: true })
        }
      />
    </PageContainer>
  );
}

export default ProjectGroupCreatePage;
