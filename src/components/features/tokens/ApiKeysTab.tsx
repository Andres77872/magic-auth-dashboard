/**
 * API Keys Tab
 *
 * Admin view for managing consumer API tokens BY USER.
 * Admin selects/searches a user first, then sees and manages that user's tokens.
 * Backend requires user_hash or project_hash filter — never loads all tokens.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Key, Plus, RefreshCw, AlertCircle, Edit, Trash2, Search, Users } from 'lucide-react';
import { DataView } from '@/components/common/DataView';
import { ActionsMenu } from '@/components/common/ActionsMenu';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Pagination } from '@/components/common/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApiKeys, useUsers } from '@/hooks';
import { ApiKeyCreateModal } from './ApiKeyCreateModal';
import { ApiKeyEditModal } from './ApiKeyEditModal';
import { ApiKeyRevealModal } from './ApiKeyRevealModal';
import { computeApiKeyStatus } from '@/types/api-key.types';
import type { ApiKeyStatus } from '@/types/api-key.types';
import type { ApiKey, CreateApiKeyResponse } from '@/types/api-key.types';
import type { DataViewColumn } from '@/components/common/DataView.types';
import type { User } from '@/types/auth.types';
import type { ProjectDetails } from '@/types/project.types';
import { projectService } from '@/services/project.service';

// Status badge configuration
const statusBadgeConfig: Record<ApiKeyStatus, { variant: 'subtleSuccess' | 'subtle' | 'subtleDestructive' | 'subtleWarning'; label: string }> = {
  active: { variant: 'subtleSuccess', label: 'Active' },
  expired: { variant: 'subtle', label: 'Expired' },
  revoked: { variant: 'subtleDestructive', label: 'Revoked' },
  revoking: { variant: 'subtleWarning', label: 'Revoking...' },
};

export function ApiKeysTab(): React.JSX.Element {
  // User selection state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Optional project filter
  const [filterProjectHash, setFilterProjectHash] = useState<string | undefined>(undefined);

  // Load users for selection (consumers only)
  const { users, isLoading: isLoadingUsers, setFilters: setUserFilters } = useUsers({
    limit: 50,
    initialFilters: { userType: 'consumer' },
  });

  // Only fetch tokens when a user is selected
  const { keys, isLoading, error, revokeKey, refetch, totalCount } = useApiKeys({
    userHash: selectedUser?.user_hash,
    projectHash: filterProjectHash,
    autoFetch: true,
  });

  const [availableProjects, setAvailableProjects] = useState<ProjectDetails[]>([]);

  useEffect(() => {
    projectService.getProjects().then((result) => {
      setAvailableProjects(result.projects);
    });
  }, []);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Created key for reveal modal
  const [createdKeyData, setCreatedKeyData] = useState<CreateApiKeyResponse | null>(null);

  // Selected key for actions
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // User selection handler
  const handleSelectUser = useCallback((user: User) => {
    setSelectedUser(user);
    setFilterProjectHash(undefined);
    setCurrentPage(1);
  }, []);

  const handleClearUser = useCallback(() => {
    setSelectedUser(null);
    setFilterProjectHash(undefined);
    setCurrentPage(1);
  }, []);

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    void refetch({ limit: itemsPerPage, offset: (page - 1) * itemsPerPage });
  }, [refetch]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Handlers
  const handleCreateClick = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleCreateSuccess = useCallback((response: CreateApiKeyResponse) => {
    setCreatedKeyData(response);
    setIsCreateModalOpen(false);
    setIsRevealModalOpen(true);
  }, []);

  const handleRevealConfirm = useCallback(() => {
    setIsRevealModalOpen(false);
    setCreatedKeyData(null);
    void refetch();
  }, [refetch]);

  const handleEditClick = useCallback((key: ApiKey) => {
    setSelectedKey(key);
    setIsEditModalOpen(true);
  }, []);

  const handleRevokeClick = useCallback((key: ApiKey) => {
    setSelectedKey(key);
    setIsRevokeDialogOpen(true);
  }, []);

  const handleRevokeConfirm = useCallback(() => {
    if (!selectedKey) return;

    setIsRevoking(true);
    void revokeKey(selectedKey.public_id).then((success) => {
      setIsRevoking(false);

      if (success) {
        setIsRevokeDialogOpen(false);
        setSelectedKey(null);
        setTimeout(() => {
          void refetch();
        }, 60000);
      }
    });
  }, [selectedKey, revokeKey, refetch]);

  // Search users on query change
  const handleUserSearch = useCallback((query: string) => {
    setUserSearchQuery(query);
    setUserFilters({ userType: 'consumer', search: query || undefined });
  }, [setUserFilters]);

  // Filter consumer users from loaded list
  const consumerUsers = useMemo(() => {
    return users.filter(u => u.user_type === 'consumer');
  }, [users]);

  // Table columns
  const columns: DataViewColumn<ApiKey>[] = useMemo(() => [
    {
      key: 'fingerprint',
      header: 'Fingerprint',
      sortable: true,
      render: (_value, row) => (
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{row.fingerprint}</span>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (_value, row) => (
        <span className="font-medium">{row.name || 'Unnamed'}</span>
      ),
    },
    {
      key: 'secret_last4',
      header: 'Key',
      render: (_value, row) => (
        <span className="font-mono text-xs text-muted-foreground">
          ...{row.secret_last4}
        </span>
      ),
    },
    {
      key: 'expires_at',
      header: 'Expires',
      sortable: true,
      render: (_value, row): ReactNode => {
        const status = computeApiKeyStatus(row);
        const isDeemphasized = status === 'revoked' || status === 'revoking';
        if (!row.expires_at) return <span className={`text-muted-foreground ${isDeemphasized ? 'opacity-50' : ''}`}>Never</span>;
        const expiry = new Date(row.expires_at);
        const isExpired = expiry < new Date();
        return (
          <span className={`${isExpired ? 'text-warning' : ''} ${isDeemphasized ? 'opacity-50' : ''}`}>
            {expiry.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (_value, row): ReactNode => {
        const wasRecentlyRevoked = row.revoked_at && 
          (new Date().getTime() - new Date(row.revoked_at).getTime() < 60000);
        const status = wasRecentlyRevoked ? 'revoking' : computeApiKeyStatus(row);
        const config = statusBadgeConfig[status];
        return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
      },
    },
    {
      key: 'public_id',
      header: '',
      render: (_value, row): ReactNode => {
        const status = computeApiKeyStatus(row);
        if (status === 'revoked') return null;
        
        const isRevokingStatus = status === 'revoking';
        const canEdit = status === 'active' || status === 'expired';
        const canRevoke = canEdit && !isRevokingStatus;
        
        return (
          <ActionsMenu
            items={[
              {
                key: 'edit',
                label: 'Edit',
                icon: <Edit className="h-4 w-4" />,
                onClick: () => handleEditClick(row),
                disabled: !canEdit,
              },
              {
                key: 'revoke',
                label: 'Revoke',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: () => handleRevokeClick(row),
                destructive: true,
                disabled: !canRevoke,
              },
            ]}
            ariaLabel={`Actions for key ${row.fingerprint}`}
          />
        );
      },
    },
  ], [handleEditClick, handleRevokeClick]);

  // Key extractor
  const keyExtractor = useCallback((key: ApiKey) => key.public_id, []);

  // Row className for de-emphasizing revoked keys
  const rowClassName = useCallback((key: ApiKey) => {
    const status = computeApiKeyStatus(key);
    return status === 'revoked' || status === 'revoking' ? 'opacity-50 bg-muted/30' : '';
  }, []);

  // Empty state
  const emptyAction = useMemo(() => (
    <Button onClick={handleCreateClick}>
      <Plus className="h-4 w-4 mr-2" />
      Create API Key
    </Button>
  ), [handleCreateClick]);

  return (
    <>
      {/* User Selector - compact inline layout */}
      <div className="space-y-2">
        {selectedUser ? (
          // Compact selected user display
          <div className="flex items-center gap-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
              {selectedUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-sm">{selectedUser.username}</span>
              <span className="text-xs text-muted-foreground ml-2">({selectedUser.user_hash})</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearUser}>
              Change
            </Button>
          </div>
        ) : (
          // User search and selection
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={userSearchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="Search and select a consumer user to manage their tokens..."
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            {isLoadingUsers ? (
              <p className="text-sm text-muted-foreground py-2 px-1">Loading users...</p>
            ) : consumerUsers.length > 0 ? (
              <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
                {consumerUsers.map((user) => (
                  <button
                    key={user.user_hash}
                    onClick={() => handleSelectUser(user)}
                    className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium shrink-0">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{user.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{user.user_hash}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2 px-1">
                {userSearchQuery ? 'No consumers found matching your search.' : 'No consumer users found.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tokens section — only shown when a user is selected */}
      {selectedUser && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button onClick={handleCreateClick} disabled={isLoading}>
                <Plus className="h-4 w-4 mr-2" />
                Create Token for {selectedUser.username}
              </Button>

              {/* Optional project filter */}
              <div className="flex items-center gap-2">
                <Select
                  value={filterProjectHash ?? '__all__'}
                  onValueChange={(value) => {
                    setFilterProjectHash(value === '__all__' ? undefined : value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-48 h-9 text-sm">
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All projects</SelectItem>
                    {availableProjects.map((project) => (
                      <SelectItem key={project.project_hash} value={project.project_hash}>
                        {project.project_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Error state */}
          {error && !isLoading && (
            <div className="flex flex-col items-center gap-4 py-8">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => void refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          {/* Keys table */}
          {!error && (
            <DataView
              data={keys}
              columns={columns}
              keyExtractor={keyExtractor}
              isLoading={isLoading}
              rowClassName={rowClassName}
              emptyMessage={`No API tokens found for ${selectedUser.username}`}
              emptyDescription="Create a token to grant this user programmatic project access"
              emptyIcon={<Key className="h-12 w-12 text-muted-foreground" />}
              emptyAction={emptyAction}
              skeletonRows={5}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              itemLabelSingular="token"
              itemLabelPlural="tokens"
              size="sm"
            />
          )}
        </>
      )}

      {/* Create Modal — pre-fill user hash */}
      <ApiKeyCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        accessibleProjects={availableProjects}
        prefilledUserHash={selectedUser?.user_hash}
      />

      {/* Reveal Modal */}
      {createdKeyData && (
        <ApiKeyRevealModal
          isOpen={isRevealModalOpen}
          onClose={handleRevealConfirm}
          keyData={createdKeyData}
        />
      )}

      {/* Revoke Dialog */}
      <ConfirmDialog
        isOpen={isRevokeDialogOpen}
        onClose={() => {
          setIsRevokeDialogOpen(false);
          setSelectedKey(null);
        }}
        onConfirm={handleRevokeConfirm}
        title="Revoke Consumer Token"
        message={
          selectedKey
            ? `Are you sure you want to revoke token "${selectedKey.fingerprint}"? This action cannot be undone. Any services using this token will lose access immediately. Changes may take up to 60 seconds to propagate due to cache.`
            : ''
        }
        confirmText="Revoke"
        cancelText="Cancel"
        variant="danger"
        isLoading={isRevoking}
      />

      {/* Edit Modal */}
      <ApiKeyEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedKey(null);
        }}
        keyData={selectedKey}
        onSuccess={() => void refetch()}
      />
    </>
  );
}

export default ApiKeysTab;
