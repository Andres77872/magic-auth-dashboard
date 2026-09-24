/**
 * EmailTemplatesList
 *
 * Table of every transactional template (built-in and custom) with where its
 * active content comes from, its version, required variables and whether it is
 * enabled. The list is not paginated by the API, so search is local.
 */

import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { DataView, type DataViewColumn } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';
import {
  emailTemplateLabel,
  emailTemplatePurposeLabel,
  emailTemplateSourceBadge,
  emailTemplateStatusBadge,
  type EmailTemplateSummary,
} from '@/types/email-templates.types';
import { emailTemplateEditorPath } from './paths';

interface EmailTemplateRow extends EmailTemplateSummary {
  /** Display name, searchable alongside the code and subject. */
  name: string;
}

function VariableChips({ names }: { names: string[] }): React.JSX.Element {
  if (names.length === 0)
    return <span className="text-xs text-muted-foreground">None</span>;
  return (
    <div className="flex max-w-[260px] flex-wrap gap-1">
      {names.slice(0, 2).map((name) => (
        <span
          key={name}
          className="max-w-[160px] truncate rounded-sm border border-border bg-secondary/60 px-1.5 py-px font-mono text-[11px] text-foreground"
          title={`$${name}`}
        >
          ${name}
        </span>
      ))}
      {names.length > 2 && (
        <span
          className="px-1 text-[11px] text-muted-foreground"
          title={names
            .slice(2)
            .map((n) => `$${n}`)
            .join(', ')}
        >
          +{names.length - 2}
        </span>
      )}
    </div>
  );
}

interface EmailTemplatesListProps {
  templates: EmailTemplateSummary[];
  isLoading: boolean;
  /** Rendered in the empty state (one action). */
  emptyAction?: React.ReactNode;
}

export function EmailTemplatesList({
  templates,
  isLoading,
  emptyAction,
}: EmailTemplatesListProps): React.JSX.Element {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const isSearching = search.trim() !== '';

  const rows = useMemo<EmailTemplateRow[]>(
    () =>
      templates.map((template) => ({
        ...template,
        name: emailTemplateLabel(template.templateCode),
      })),
    [templates]
  );

  const columns = useMemo<DataViewColumn<EmailTemplateRow>[]>(
    () => [
      {
        key: 'name',
        header: 'Template',
        render: (_value, row) => (
          <div className="min-w-0">
            <Link
              to={emailTemplateEditorPath(row.templateCode)}
              onClick={(event) => event.stopPropagation()}
              className="block truncate text-[13px] font-medium text-foreground no-underline hover:underline"
            >
              {row.name}
            </Link>
            <span className="block truncate font-mono text-xs text-muted-foreground">
              {row.templateCode}
            </span>
          </div>
        ),
      },
      {
        key: 'subjectTemplate',
        header: 'Subject',
        hideOnMobile: true,
        render: (_value, row) => (
          <span
            className="line-clamp-2 max-w-[360px] text-[13px] text-muted-foreground"
            title={row.subjectTemplate}
          >
            {row.subjectTemplate || '—'}
          </span>
        ),
      },
      {
        key: 'source',
        header: 'Content',
        width: '190px',
        render: (_value, row) => {
          const badge = emailTemplateSourceBadge(row);
          return (
            <div className="flex flex-col items-start gap-1">
              <Badge variant={badge.variant} size="sm">
                {badge.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {row.version !== null ? (
                  <span className="font-mono">v{row.version}</span>
                ) : (
                  'No saved version'
                )}
                {row.isDynamic &&
                  ` · ${emailTemplatePurposeLabel(row.purpose)}`}
              </span>
            </div>
          );
        },
      },
      {
        key: 'requiredVariables',
        header: 'Required variables',
        hideOnMobile: true,
        render: (_value, row) => (
          <VariableChips names={row.requiredVariables} />
        ),
      },
      {
        key: 'isEnabled',
        header: 'Status',
        width: '130px',
        render: (_value, row) => {
          const badge = emailTemplateStatusBadge(row);
          return (
            <div className="flex flex-col items-start gap-1">
              <Badge variant={badge.variant} size="sm" dot>
                {badge.label}
              </Badge>
              {!row.isEnabled && row.disabledAt && (
                <span
                  className="whitespace-nowrap text-xs text-muted-foreground"
                  title={formatDateTime(row.disabledAt)}
                >
                  {formatRelativeTime(row.disabledAt)}
                </span>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <DataView<EmailTemplateRow>
      data={rows}
      columns={columns}
      keyExtractor={(row) => row.templateCode}
      showSearch
      enableLocalSearch
      searchValue={search}
      onSearchChange={setSearch}
      searchKeys={['name', 'templateCode', 'subjectTemplate']}
      searchPlaceholder="Search by name, code or subject"
      onRowClick={(row) =>
        void navigate(emailTemplateEditorPath(row.templateCode))
      }
      rowClassName={(row) => (row.isEnabled ? '' : 'opacity-70')}
      isLoading={isLoading}
      skeletonRows={7}
      emptyIcon={<Mail className="h-8 w-8" />}
      emptyMessage={
        isSearching ? 'No templates match this search' : 'No email templates'
      }
      emptyDescription={
        isSearching
          ? 'Try a different name, code or subject.'
          : 'No templates were returned.'
      }
      emptyAction={isSearching ? undefined : emptyAction}
      caption="Email templates"
    />
  );
}

export default EmailTemplatesList;
