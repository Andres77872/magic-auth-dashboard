import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { DataView, type DataViewColumn } from '@/components/common';
import { Panel } from '@/components/common/Panel';
import { ErrorState } from '@/components/common/ErrorState';
import { TabNavigation } from '@/components/common/TabNavigation';
import { TablePager } from '@/components/common/TablePager';
import { UserTypeBadge } from '@/components/common/UserTypeBadge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/features/users/UserAvatar';
import { useProjectMembers } from '@/hooks/useProjectDetails';
import { formatDate, formatDateTime, formatNumber } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import { cn } from '@/lib/utils';
import type { ProjectMember } from '@/types/project.types';

const TYPE_FILTERS = ['all', 'root', 'admin', 'consumer'] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];
const PAGE_SIZES = [25, 50, 100];

function GroupChips({ groups }: { groups: string[] }): React.JSX.Element {
  if (groups.length === 0)
    return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex max-w-[280px] flex-wrap gap-1">
      {groups.slice(0, 3).map((name) => (
        <span
          key={name}
          className="max-w-[140px] truncate rounded border border-border bg-secondary/60 px-1.5 py-px text-[11px] text-foreground"
          title={name}
        >
          {name}
        </span>
      ))}
      {groups.length > 3 && (
        <span
          className="px-1 text-[11px] text-muted-foreground"
          title={groups.slice(3).join(', ')}
        >
          +{groups.length - 3}
        </span>
      )}
    </div>
  );
}

/**
 * Users who can reach the project: members of user groups granted one of its
 * project groups, plus every root user. Server-paginated; membership is managed
 * on the user groups, not here.
 */
export function ProjectMembersTab({
  projectHash,
}: {
  projectHash: string;
}): React.JSX.Element {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(25);

  const { members, pagination, isLoading, isRefreshing, error, refetch } =
    useProjectMembers(projectHash, {
      offset,
      limit,
      userType: typeFilter === 'all' ? undefined : typeFilter,
    });

  const columns = useMemo<DataViewColumn<ProjectMember>[]>(
    () => [
      {
        key: 'username',
        header: 'Member',
        render: (_value, member) => (
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar username={member.username} size="sm" />
            <div className="min-w-0">
              <Link
                to={`${ROUTES.USERS}/${encodeURIComponent(member.user_hash)}`}
                onClick={(event) => event.stopPropagation()}
                className="block truncate text-[13px] font-medium text-foreground no-underline hover:underline"
              >
                {member.username}
              </Link>
              <span className="block truncate text-xs text-muted-foreground">
                {member.email || 'No email'}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'user_type',
        header: 'Type',
        width: '110px',
        render: (_value, member) => (
          <UserTypeBadge userType={member.user_type} />
        ),
      },
      {
        key: 'groups',
        header: 'User groups',
        hideOnMobile: true,
        render: (_value, member) =>
          member.user_type === 'root' ? (
            <span className="text-xs text-muted-foreground">Every project</span>
          ) : (
            <GroupChips groups={member.groups} />
          ),
      },
      {
        key: 'joined_at',
        header: 'Access since',
        width: '130px',
        hideOnMobile: true,
        render: (_value, member) => (
          <span
            className="whitespace-nowrap text-xs text-muted-foreground"
            title={
              member.joined_at ? formatDateTime(member.joined_at) : undefined
            }
          >
            {formatDate(member.joined_at)}
          </span>
        ),
      },
    ],
    []
  );

  const total = pagination?.total;

  return (
    <Panel
      title="Members"
      description={
        <>
          Users in user groups granted one of this project&apos;s project
          groups, plus every root user. Consumer group lists show all of their
          groups, not only the ones that grant this project.
          {total !== undefined &&
            ` · ${formatNumber(total)} ${total === 1 ? 'member' : 'members'}`}
        </>
      }
      actions={
        <TabNavigation
          variant="segmented"
          size="sm"
          ariaLabel="Filter members by user type"
          activeTab={typeFilter}
          onChange={(tab) => {
            setTypeFilter(
              (TYPE_FILTERS as readonly string[]).includes(tab)
                ? (tab as TypeFilter)
                : 'all'
            );
            setOffset(0);
          }}
          tabs={[
            { id: 'all', label: 'All' },
            { id: 'root', label: 'Root' },
            { id: 'admin', label: 'Admin' },
            { id: 'consumer', label: 'Consumer' },
          ]}
        />
      }
    >
      {error && members.length === 0 ? (
        <ErrorState
          title="Members could not be loaded"
          message={error}
          onRetry={() => void refetch()}
          isRetrying={isRefreshing}
          variant="inline"
          size="sm"
        />
      ) : (
        <div className={cn('transition-opacity', isRefreshing && 'opacity-70')}>
          <DataView<ProjectMember>
            data={members}
            columns={columns}
            keyExtractor={(member) => member.user_hash}
            onRowClick={(member) =>
              void navigate(
                `${ROUTES.USERS}/${encodeURIComponent(member.user_hash)}`
              )
            }
            isLoading={isLoading}
            skeletonRows={6}
            emptyIcon={<Users className="h-8 w-8" />}
            emptyMessage={
              typeFilter === 'all'
                ? 'No members yet'
                : `No ${typeFilter} members`
            }
            emptyDescription={
              typeFilter === 'all'
                ? 'Grant a user group one of this project’s project groups, then add users to that group.'
                : 'Try another user type.'
            }
            emptyAction={
              typeFilter !== 'all' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setTypeFilter('all');
                    setOffset(0);
                  }}
                >
                  Show all members
                </Button>
              ) : undefined
            }
            caption="Project members"
          />
          <TablePager
            offset={offset}
            limit={limit}
            pageCount={members.length}
            total={total}
            onOffsetChange={setOffset}
            pageSizeOptions={PAGE_SIZES}
            onLimitChange={(next) => {
              setLimit(next);
              setOffset(0);
            }}
            itemLabel="members"
          />
        </div>
      )}
    </Panel>
  );
}

export default ProjectMembersTab;
