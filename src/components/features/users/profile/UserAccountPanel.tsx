import React, { useCallback } from 'react';
import { MailCheck } from 'lucide-react';
import { CopyableId, FactList, Panel } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAsyncData } from '@/hooks';
import { userService } from '@/services/user.service';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';
import type { User } from '@/types/auth.types';
import type { UserEmail } from '@/types/user.types';

interface UserAccountPanelProps {
  user: User;
}

function EmailStatus({ email }: { email: UserEmail }): React.JSX.Element {
  const verified = email.status === 'active' || Boolean(email.activated_at);
  return (
    <Badge variant={verified ? 'success' : 'warning'} size="sm">
      {verified ? 'Verified' : email.status.replace(/_/g, ' ')}
    </Badge>
  );
}

/** Identity facts and the user's registered sign-in emails. */
export function UserAccountPanel({
  user,
}: UserAccountPanelProps): React.JSX.Element {
  const fetchEmails = useCallback(
    () => userService.getUserEmails(user.user_hash),
    [user.user_hash]
  );
  const emails = useAsyncData(fetchEmails, { enabled: user.is_active });

  return (
    <Panel title="Account">
      <FactList
        facts={[
          {
            label: 'User ID',
            value: (
              <CopyableId id={user.user_hash} startChars={10} endChars={4} />
            ),
          },
          {
            label: 'Contact email',
            value: user.email || (
              <span className="text-muted-foreground">Not set</span>
            ),
          },
          { label: 'Created', value: formatDateTime(user.created_at) },
          { label: 'Updated', value: formatDateTime(user.updated_at, 'Never') },
          {
            label: 'Last sign-in',
            value: user.last_login ? (
              <span title={formatDateTime(user.last_login)}>
                {formatRelativeTime(user.last_login)}
              </span>
            ) : (
              'Never'
            ),
          },
        ]}
      />

      <div className="mt-4 border-t border-border pt-4">
        <h3 className="m-0 mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <MailCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Sign-in emails
        </h3>
        {emails.isLoading ? (
          <Skeleton className="h-5 w-2/3" />
        ) : emails.error ? (
          <p className="m-0 text-xs text-muted-foreground">
            Emails could not be loaded.
          </p>
        ) : (emails.data?.emails ?? []).length === 0 ? (
          <p className="m-0 text-xs text-muted-foreground">
            No sign-in emails registered.
          </p>
        ) : (
          <ul className="m-0 list-none space-y-1.5 p-0">
            {(emails.data?.emails ?? []).map((email) => (
              <li
                key={String(email.id)}
                className="flex items-center justify-between gap-3 text-[13px]"
              >
                <span className="min-w-0 truncate font-mono text-xs text-foreground">
                  {email.email_masked}
                  {email.is_primary && (
                    <span className="ml-2 font-sans text-muted-foreground">
                      Primary
                    </span>
                  )}
                </span>
                <EmailStatus email={email} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

export default UserAccountPanel;
