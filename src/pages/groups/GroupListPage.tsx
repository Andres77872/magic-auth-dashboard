import React from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { useTabParam } from '@/hooks/useTabParam';
import { UserGroupsListView } from './components/UserGroupsListView';
import { ProjectGroupsListView } from './components/ProjectGroupsListView';

const GROUP_LIST_TABS = ['user-groups', 'project-groups'] as const;

/**
 * `/groups` hosts two lists that the sidebar presents as separate pages:
 * user groups (`?tab=user-groups`, the default) and project groups
 * (`?tab=project-groups`). Each renders its own header and primary action.
 */
export function GroupListPage(): React.JSX.Element {
  const [tab] = useTabParam(GROUP_LIST_TABS, 'user-groups');
  return (
    <PageContainer>
      {tab === 'project-groups' ? (
        <ProjectGroupsListView key="project-groups" />
      ) : (
        <UserGroupsListView key="user-groups" />
      )}
    </PageContainer>
  );
}

export default GroupListPage;
