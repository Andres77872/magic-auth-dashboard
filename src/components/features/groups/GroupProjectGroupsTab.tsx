import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderTree, Link2Off, Plus } from 'lucide-react';
import { DataView, type DataViewColumn } from '@/components/common/DataView';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { useGroupProjectGroupGrants } from '@/hooks/useGroupDetails';
import { useToast } from '@/hooks/useToast';
import { formatCount, formatNumber } from '@/utils/formatters';
import type { GroupBatchResult, ProjectGroupGrant } from '@/types/group.types';
import { DefaultGroupBadge } from './GroupBadges';
import { GrantProjectGroupsModal } from './GrantProjectGroupsModal';
import { GroupSectionHeader } from './GroupSectionHeader';
import { NameCell, TimeCell } from './GroupCells';
import { groupRoutes } from './group-routes';

export interface GroupProjectGroupsTabProps {
  groupHash: string;
  groupName: string;
  /** False for non-root operators on `admin_…` groups (the backend would answer 403). */
  canManage: boolean;
  /** Called after grants changed, so the page can refresh its counts. */
  onAccessChange?: () => void;
}

/** Project groups granted to a user group, with grant and revoke. */
export function GroupProjectGroupsTab({
  groupHash,
  groupName,
  canManage,
  onAccessChange,
}: GroupProjectGroupsTabProps): React.JSX.Element {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { grants, isLoading, isRefreshing, error, refetch, grant, revoke } =
    useGroupProjectGroupGrants(groupHash);
  const [isGranting, setIsGranting] = useState(false);
  const [toRevoke, setToRevoke] = useState<ProjectGroupGrant | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleGranted = (result: GroupBatchResult): void => {
    const granted = result.succeeded.length;
    showToast(
      result.failures.length > 0
        ? `Granted ${formatNumber(granted)} of ${formatCount(granted + result.failures.length, 'project group')}; ${formatNumber(result.failures.length)} failed.`
        : `Granted ${formatCount(granted, 'project group')} to ${groupName}.`,
      result.failures.length > 0 ? 'warning' : 'success'
    );
    void refetch();
    onAccessChange?.();
  };

  const handleRevoke = async (target: ProjectGroupGrant): Promise<void> => {
    setIsRevoking(true);
    try {
      await revoke(target.group_hash);
      showToast(`Revoked ${target.group_name} from ${groupName}.`, 'success');
      setToRevoke(null);
      void refetch();
      onAccessChange?.();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Access could not be revoked.',
        'error'
      );
    } finally {
      setIsRevoking(false);
    }
  };

  const columns: DataViewColumn<ProjectGroupGrant>[] = [
    {
      key: 'group_name',
      header: 'Project group',
      render: (_value, pg) => (
        <NameCell
          to={groupRoutes.projectGroup(pg.group_hash)}
          name={pg.group_name}
          description={pg.group_description}
          badges={<DefaultGroupBadge kind="project" name={pg.group_name} />}
        />
      ),
    },
    {
      key: 'granted_at',
      header: 'Granted',
      width: '140px',
      hideOnMobile: true,
      render: (_value, pg) => <TimeCell value={pg.granted_at} />,
    },
    {
      key: 'group_hash',
      header: 'Actions',
      width: '72px',
      align: 'right',
      render: (_value, pg) => (
        <span data-no-row-click>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setToRevoke(pg)}
            disabled={!canManage}
            aria-label={`Revoke ${pg.group_name} from ${groupName}`}
            title={
              canManage
                ? 'Revoke access'
                : 'Only root users can change this group'
            }
          >
            <Link2Off aria-hidden="true" />
          </Button>
        </span>
      ),
    },
  ];

  const grantButton = (variant: 'primary' | 'secondary'): React.JSX.Element => (
    <Button
      variant={variant}
      size="md"
      leftIcon={<Plus aria-hidden="true" />}
      onClick={() => setIsGranting(true)}
      disabled={!canManage}
    >
      Grant project groups
    </Button>
  );

  return (
    <section aria-label="Project groups">
      <GroupSectionHeader
        title="Project groups"
        description="Members of this group can sign in to every project in these project groups."
        actions={grantButton('primary')}
      />

      {error && grants.length === 0 && !isLoading ? (
        <ErrorState
          retryLabel="Try again"
          title="Project groups couldn't be loaded"
          message={error}
          onRetry={() => void refetch()}
          isRetrying={isRefreshing}
          variant="inline"
          size="sm"
        />
      ) : (
        <DataView<ProjectGroupGrant>
          data={grants}
          columns={columns}
          keyExtractor={(pg) => pg.group_hash}
          onRowClick={(pg) =>
            void navigate(groupRoutes.projectGroup(pg.group_hash))
          }
          isLoading={isLoading}
          skeletonRows={3}
          emptyIcon={<FolderTree className="h-8 w-8" />}
          emptyMessage="No project groups granted"
          emptyDescription="Members can't reach any project through this group yet."
          emptyAction={canManage ? grantButton('secondary') : undefined}
          caption={`Project groups granted to ${groupName}`}
        />
      )}

      {isGranting && (
        <GrantProjectGroupsModal
          groupName={groupName}
          grantedHashes={grants.map((pg) => pg.group_hash)}
          onClose={() => setIsGranting(false)}
          onGrant={grant}
          onGranted={handleGranted}
        />
      )}

      <ConfirmDialog
        isOpen={toRevoke !== null}
        onClose={() => setToRevoke(null)}
        onConfirm={() => {
          if (toRevoke) void handleRevoke(toRevoke);
        }}
        title="Revoke project group"
        message={
          toRevoke ? (
            <>
              Members of{' '}
              <strong className="text-foreground">{groupName}</strong> lose
              access to the projects in{' '}
              <strong className="text-foreground">{toRevoke.group_name}</strong>{' '}
              unless another grant covers them. Their sessions for those
              projects are signed out.
            </>
          ) : (
            ''
          )
        }
        confirmText="Revoke access"
        variant="danger"
        isLoading={isRevoking}
      />
    </section>
  );
}

export default GroupProjectGroupsTab;
