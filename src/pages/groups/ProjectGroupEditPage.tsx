import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { groupRoutes } from '@/components/features/groups';
import { ProjectGroupDetailsPage } from './ProjectGroupDetailsPage';

/**
 * `/groups/project-groups/edit/:groupHash` (kept for old links): the project
 * group's details with the edit dialog open. Closing it returns to the details URL.
 */
export function ProjectGroupEditPage(): React.JSX.Element {
  const { groupHash } = useParams<{ groupHash: string }>();
  const navigate = useNavigate();
  if (!groupHash) return <Navigate to={groupRoutes.projectGroupList} replace />;
  return (
    <ProjectGroupDetailsPage
      startEditing
      onEditDismiss={() =>
        void navigate(groupRoutes.projectGroup(groupHash), { replace: true })
      }
    />
  );
}

export default ProjectGroupEditPage;
