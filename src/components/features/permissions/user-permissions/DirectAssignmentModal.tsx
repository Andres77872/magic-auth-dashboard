import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  User,
  Layers,
  X,
  AlertCircle
} from 'lucide-react';
import { userService, permissionAssignmentsService } from '@/services';
import { usePermissionManagement } from '@/contexts/PermissionManagementContext';
import type { GlobalPermissionGroup } from '@/types/global-roles.types';

interface SearchedUser {
  user_hash: string;
  username: string;
  email: string;
  user_type: string;
  is_active: boolean;
}

interface DirectAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedUser?: SearchedUser | null;
  preselectedGroup?: GlobalPermissionGroup | null;
}

export function DirectAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedUser = null,
  preselectedGroup = null
}: DirectAssignmentModalProps): React.JSX.Element {
  const { permissionGroups, permissionGroupsLoading } = usePermissionManagement();

  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(preselectedUser);
  const [selectedGroupHash, setSelectedGroupHash] = useState<string>(preselectedGroup?.group_hash || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedUser(preselectedUser);
      setSelectedGroupHash(preselectedGroup?.group_hash || '');
      setNotes('');
      setError(null);
      setSearchQuery(preselectedUser?.username || '');
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [isOpen, preselectedUser, preselectedGroup]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await userService.searchUsers({ q: query, limit: 10 });
      if (response.success && response.users) {
        setSearchResults(response.users);
        setShowDropdown(true);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('User search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSelectedUser(null);
    setError(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(value);
    }, 300);
  };

  const handleUserSelect = (user: SearchedUser) => {
    setSelectedUser(user);
    setSearchQuery(user.username);
    setShowDropdown(false);
    setError(null);
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    if (!selectedGroupHash) {
      setError('Please select a permission group');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await permissionAssignmentsService.assignPermissionGroupToUser(
        selectedUser.user_hash,
        selectedGroupHash,
        notes || undefined
      );

      if (response.success !== false) {
        onSuccess?.();
        onClose();
      } else {
        setError((response as any).message || 'Failed to assign permission group');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to assign permission group';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedGroup = permissionGroups.find(g => g.group_hash === selectedGroupHash);

  const groupedPermissionGroups = permissionGroups.reduce((acc, group) => {
    const category = group.group_category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(group);
    return acc;
  }, {} as Record<string, GlobalPermissionGroup[]>);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Assign Permission Group to User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 p-3">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="user_search">
              User <span className="text-destructive">*</span>
            </Label>
            <div className="relative" ref={dropdownRef}>
              {selectedUser ? (
                <div className="flex items-center justify-between rounded-md border bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedUser.username}</p>
                      <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {selectedUser.user_type}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearUser}
                    disabled={isSubmitting || !!preselectedUser}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="user_search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                      placeholder="Search by username or email..."
                      className="pl-10"
                      disabled={isSubmitting}
                      fullWidth
                    />
                    {isSearching && (
                      <Spinner size="sm" className="absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-lg">
                      {searchResults.map((user) => (
                        <button
                          key={user.user_hash}
                          type="button"
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50"
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user.username}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {user.user_type}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  {showDropdown && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-4 text-center shadow-lg">
                      <p className="text-sm text-muted-foreground">No users found</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Search for a user by username or email (minimum 2 characters)
            </p>
          </div>

          <div className="space-y-2">
            <Label>
              Permission Group <span className="text-destructive">*</span>
            </Label>
            {permissionGroupsLoading ? (
              <div className="flex items-center gap-2 p-3 border rounded-md">
                <Spinner size="sm" />
                <span className="text-sm text-muted-foreground">Loading permission groups...</span>
              </div>
            ) : (
              <Select
                value={selectedGroupHash}
                onValueChange={setSelectedGroupHash}
                disabled={isSubmitting || !!preselectedGroup}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a permission group">
                    {selectedGroup && (
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-purple-500" />
                        <span>{selectedGroup.group_display_name || selectedGroup.group_name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedPermissionGroups).map(([category, groups]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                        {category}
                      </div>
                      {groups.map((group) => (
                        <SelectItem key={group.group_hash} value={group.group_hash}>
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-purple-500" />
                            <span>{group.group_display_name || group.group_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedGroup?.group_description && (
              <p className="text-xs text-muted-foreground">
                {selectedGroup.group_description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this assignment (e.g., reason, expiration, etc.)"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={!selectedUser || !selectedGroupHash}
            >
              Assign Permission Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DirectAssignmentModal;
