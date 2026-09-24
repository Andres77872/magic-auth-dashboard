import { Link } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { ActionsMenu } from '@/components/common/ActionsMenu';
import type { DataViewColumn } from '@/components/common/DataView.types';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import { computeApiKeyStatus, type ApiKey } from '@/types/api-key.types';
import { ApiKeyStatusBadge } from './ApiKeyStatusBadge';
import { apiKeyHint, canRevoke } from './api-key-format';
import { NoRowClick, RelativeTime } from './ApiKeyCells';

interface ColumnOptions {
  /** User listings carry no owner fields, and the owner is the filter anyway. */
  showOwner: boolean;
  onOpen: (key: ApiKey) => void;
  onEdit: (key: ApiKey) => void;
  onRevoke: (key: ApiKey) => void;
}

export function buildApiKeyColumns({
  showOwner,
  onOpen,
  onEdit,
  onRevoke,
}: ColumnOptions): DataViewColumn<ApiKey>[] {
  const columns: DataViewColumn<ApiKey>[] = [
    {
      key: 'name',
      header: 'Key',
      render: (_value, key) => (
        <div className="min-w-0">
          <div className="max-w-[260px] truncate font-medium text-foreground">
            {key.name}
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            {apiKeyHint(key)}
          </div>
        </div>
      ),
    },
  ];

  if (showOwner) {
    columns.push({
      key: 'owner_username',
      header: 'Owner',
      render: (_value, key) =>
        key.owner_user_hash ? (
          <NoRowClick>
            <Link
              to={`${ROUTES.USERS}/${encodeURIComponent(key.owner_user_hash)}`}
              className="truncate text-foreground no-underline hover:underline"
            >
              {key.owner_username || key.owner_user_hash}
            </Link>
          </NoRowClick>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    });
  }

  columns.push(
    {
      key: 'project_name',
      header: 'Project',
      render: (_value, key) =>
        key.project_hash ? (
          <NoRowClick>
            <Link
              to={`${ROUTES.PROJECTS}/${encodeURIComponent(key.project_hash)}`}
              className="max-w-[200px] truncate text-foreground no-underline hover:underline"
            >
              {key.project_name || key.project_hash}
            </Link>
          </NoRowClick>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (_value, key) => <ApiKeyStatusBadge apiKey={key} />,
    },
    {
      key: 'last_used_at',
      header: 'Last used',
      hideOnMobile: true,
      render: (_value, key) => (
        <RelativeTime value={key.last_used_at} empty="Never" />
      ),
    },
    {
      key: 'expires_at',
      header: 'Expires',
      hideOnMobile: true,
      render: (_value, key) =>
        key.expires_at ? (
          <time
            dateTime={key.expires_at}
            title={formatDateTime(key.expires_at)}
            className="text-muted-foreground"
          >
            {formatDate(key.expires_at)}
          </time>
        ) : (
          <span className="text-muted-foreground">Never</span>
        ),
    },
    {
      key: 'created_at',
      header: 'Created',
      hideOnMobile: true,
      render: (_value, key) => (
        <RelativeTime value={key.created_at} empty="—" />
      ),
    },
    {
      key: 'public_id',
      header: '',
      width: '48px',
      align: 'right',
      render: (_value, key) => {
        const revoked = computeApiKeyStatus(key) === 'revoked';
        return (
          <NoRowClick>
            <ActionsMenu
              ariaLabel={`Actions for ${key.name}`}
              items={[
                {
                  key: 'view',
                  label: 'View details',
                  icon: <Eye />,
                  onClick: () => onOpen(key),
                },
                {
                  key: 'edit',
                  label: 'Edit',
                  icon: <Pencil />,
                  onClick: () => onEdit(key),
                  hidden: revoked,
                },
                {
                  key: 'revoke',
                  label: 'Revoke key',
                  icon: <Trash2 />,
                  onClick: () => onRevoke(key),
                  destructive: true,
                  hidden: !canRevoke(key),
                },
              ]}
            />
          </NoRowClick>
        );
      },
    }
  );

  return columns;
}
