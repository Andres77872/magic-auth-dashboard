import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { permissionAssignmentsService } from '@/services';
import { usePermissionManagement } from '@/contexts/PermissionManagementContext';

interface CheckResult {
  permission: string;
  has_permission: boolean;
  checked_at: Date;
}

interface UserPermissionCheckProps {
  title?: string;
  showHistory?: boolean;
  maxHistory?: number;
}

export function UserPermissionCheck({
  title = 'Check Permission',
  showHistory = true,
  maxHistory = 5
}: UserPermissionCheckProps): React.JSX.Element {
  const { permissions, permissionsLoading } = usePermissionManagement();
  const [searchValue, setSearchValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<CheckResult | null>(null);
  const [history, setHistory] = useState<CheckResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copiedPermission, setCopiedPermission] = useState<string | null>(null);

  const filteredSuggestions = useMemo(() => {
    if (!searchValue.trim() || permissionsLoading) return [];

    const search = searchValue.toLowerCase();
    return permissions
      .filter(p =>
        p.permission_name.toLowerCase().includes(search) ||
        p.permission_display_name?.toLowerCase().includes(search)
      )
      .slice(0, 10);
  }, [searchValue, permissions, permissionsLoading]);

  const handleCheck = async () => {
    const permissionName = searchValue.trim();
    if (!permissionName) return;

    setChecking(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const response: any = await permissionAssignmentsService.checkMyPermission(permissionName);
      const hasPermission = response.has_permission ?? response.data?.has_permission ?? false;

      const result: CheckResult = {
        permission: permissionName,
        has_permission: hasPermission,
        checked_at: new Date()
      };

      setCurrentResult(result);

      if (showHistory) {
        setHistory(prev => {
          const filtered = prev.filter(h => h.permission !== permissionName);
          return [result, ...filtered].slice(0, maxHistory);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check permission');
      console.error('Failed to check permission:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleSelectSuggestion = (permissionName: string) => {
    setSearchValue(permissionName);
    setShowSuggestions(false);
  };

  const handleCopy = async (permissionName: string) => {
    try {
      await navigator.clipboard.writeText(permissionName);
      setCopiedPermission(permissionName);
      setTimeout(() => setCopiedPermission(null), 2000);
    } catch {
      // Clipboard API failed
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCheck();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Verify if you have a specific permission
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Enter permission name (e.g., admin_users_read)"
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleKeyDown}
                  className="pr-10 font-mono"
                />
                {permissionsLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Spinner size="sm" />
                  </div>
                )}
              </div>
              <Button onClick={handleCheck} disabled={!searchValue.trim() || checking}>
                {checking ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Check
              </Button>
            </div>

            {showSuggestions && filteredSuggestions.length > 0 && (
              <Card className="absolute z-50 mt-1 w-full max-h-64 overflow-auto shadow-lg">
                <CardContent className="p-1">
                  {filteredSuggestions.map((perm) => (
                    <button
                      key={perm.permission_hash}
                      className="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-accent"
                      onClick={() => handleSelectSuggestion(perm.permission_name)}
                    >
                      <div>
                        <p className="font-mono text-sm">{perm.permission_name}</p>
                        {perm.permission_display_name && (
                          <p className="text-xs text-muted-foreground">
                            {perm.permission_display_name}
                          </p>
                        )}
                      </div>
                      {perm.permission_category && (
                        <Badge variant="outline" className="text-xs">
                          {perm.permission_category}
                        </Badge>
                      )}
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {currentResult && !error && (
            <Card className={currentResult.has_permission
              ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
              : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
            }>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  {currentResult.has_permission ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <p className={`font-semibold ${
                      currentResult.has_permission
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {currentResult.has_permission ? 'Permission Granted' : 'Permission Denied'}
                    </p>
                    <p className="font-mono text-sm text-muted-foreground">
                      {currentResult.permission}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(currentResult.permission)}
                >
                  {copiedPermission === currentResult.permission ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {showHistory && history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map((item, index) => (
              <div
                key={`${item.permission}-${index}`}
                className="flex items-center justify-between rounded-lg border p-2"
              >
                <div className="flex items-center gap-2">
                  {item.has_permission ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-mono text-sm">{item.permission}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {item.checked_at.toLocaleTimeString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopy(item.permission)}
                  >
                    {copiedPermission === item.permission ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default UserPermissionCheck;
