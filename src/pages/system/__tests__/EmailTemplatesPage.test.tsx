import type React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  Link,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import {
  EmailTemplateEditorPage,
  EmailTemplatesPage,
} from '../EmailTemplatesPage';
import {
  ACTIVATION_HTML,
  makeDetail,
  makeSummary,
} from '@/components/features/email-templates/__tests__/fixtures';
import type {
  UseEmailTemplateReturn,
  UseEmailTemplatesReturn,
} from '@/hooks/useEmailTemplates';

const showToast = vi.fn();
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ showToast }) }));

const setBreadcrumbLabel = vi.fn<(label: string | null | undefined) => void>();
vi.mock('@/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/contexts')>()),
  useSetBreadcrumbLabel: (label: string | null | undefined) =>
    setBreadcrumbLabel(label),
}));

let listState: UseEmailTemplatesReturn;
let detailState: UseEmailTemplateReturn;
vi.mock('@/hooks/useEmailTemplates', () => ({
  useEmailTemplates: () => listState,
  useEmailTemplate: () => detailState,
  useEmailTemplatePreview: () => ({
    preview: null,
    isLoading: false,
    error: null,
  }),
}));

beforeAll(() => {
  // Radix checkboxes/menus measure elements; jsdom has no ResizeObserver.
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

const TEMPLATES = [
  makeSummary(),
  makeSummary({
    templateCode: 'password_reset',
    purpose: 'password_reset',
    subjectTemplate: 'Reset your $app_name password',
    source: 'db',
    version: 4,
    isCustomized: true,
    requiredVariables: ['reset_link'],
  }),
  makeSummary({
    templateCode: 'ops_notice',
    purpose: 'delivery_operation',
    subjectTemplate: 'Notice $ticket_id',
    source: 'db',
    version: 1,
    isCustomized: true,
    isDynamic: true,
    isEnabled: false,
    disabledAt: '2026-09-20T10:00:00Z',
    requiredVariables: ['notice'],
    allowedVariables: ['notice', 'ticket_id'],
  }),
];

function makeListState(
  overrides: Partial<UseEmailTemplatesReturn> = {}
): UseEmailTemplatesReturn {
  return {
    templates: TEMPLATES,
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi
      .fn<UseEmailTemplatesReturn['refetch']>()
      .mockResolvedValue(undefined),
    createTemplate: vi
      .fn<UseEmailTemplatesReturn['createTemplate']>()
      .mockResolvedValue({ templateCode: 'ops_incident', version: 1 }),
    ...overrides,
  };
}

function makeDetailState(
  overrides: Partial<UseEmailTemplateReturn> = {}
): UseEmailTemplateReturn {
  return {
    template: makeDetail(),
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi
      .fn<UseEmailTemplateReturn['refetch']>()
      .mockResolvedValue(undefined),
    save: vi.fn<UseEmailTemplateReturn['save']>().mockResolvedValue(1),
    rollback: vi
      .fn<UseEmailTemplateReturn['rollback']>()
      .mockResolvedValue(undefined),
    disable: vi
      .fn<UseEmailTemplateReturn['disable']>()
      .mockResolvedValue(undefined),
    sendTest: vi
      .fn<UseEmailTemplateReturn['sendTest']>()
      .mockResolvedValue({ recipientMasked: 'r***', provider: 'fake' }),
    ...overrides,
  };
}

function LocationProbe(): React.JSX.Element {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderAt(url: string): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Link to="/users">Users</Link>
      <Routes>
        <Route path="/email-templates" element={<EmailTemplatesPage />} />
        <Route
          path="/email-templates/:templateCode"
          element={<EmailTemplateEditorPage />}
        />
        <Route path="*" element={null} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  );
}

describe('EmailTemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listState = makeListState();
    detailState = makeDetailState();
  });

  it('lists templates with a useful subtitle, status and content badges', () => {
    renderAt('/email-templates');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Email templates' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('3 templates · 1 customized · 1 custom · 1 disabled')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Email activation' })
    ).toHaveAttribute('href', '/email-templates/email_activation');
    expect(screen.getByRole('link', { name: 'Ops notice' })).toHaveAttribute(
      'href',
      '/email-templates/ops_notice'
    );
    expect(screen.getByText('Customized')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getAllByText('Enabled')).toHaveLength(2);
  });

  it('opens the editor when a row is clicked', () => {
    renderAt('/email-templates');
    fireEvent.click(screen.getByText('Reset your $app_name password'));
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/email-templates/password_reset'
    );
  });

  it('filters locally and explains an empty search', () => {
    renderAt('/email-templates');
    const search = screen.getByLabelText('Search by name, code or subject');

    fireEvent.change(search, { target: { value: 'reset' } });
    expect(
      screen.getByRole('link', { name: 'Password reset' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Email activation' })
    ).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(
      screen.getByText('No templates match this search')
    ).toBeInTheDocument();
  });

  it('shows the backend error with a retry when nothing could be loaded', () => {
    listState = makeListState({
      templates: [],
      error: 'ROOT access required to manage email templates',
    });
    renderAt('/email-templates');

    expect(
      screen.getByText('Email templates could not be loaded')
    ).toBeInTheDocument();
    expect(
      screen.getByText('ROOT access required to manage email templates')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(listState.refetch).toHaveBeenCalledTimes(1);
  });

  it('refreshes on demand', () => {
    renderAt('/email-templates');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh templates' }));
    expect(listState.refetch).toHaveBeenCalledTimes(1);
  });

  it('creates a custom template and opens it in the editor', async () => {
    renderAt('/email-templates');
    fireEvent.click(screen.getByRole('button', { name: 'Create template' }));
    const dialog = await screen.findByRole('dialog');
    const form = within(dialog);

    fireEvent.change(form.getByLabelText('Code'), {
      target: { value: 'ops_incident' },
    });
    fireEvent.click(form.getByRole('radio', { name: /Security notification/ }));
    fireEvent.change(form.getByLabelText('Variables'), {
      target: { value: 'notice, ticket_id' },
    });
    fireEvent.click(form.getByRole('checkbox', { name: '$notice' }));
    fireEvent.change(form.getByLabelText('Subject'), {
      target: { value: 'Notice $ticket_id' },
    });
    fireEvent.change(form.getByLabelText('HTML body'), {
      target: { value: '<p>$notice</p>' },
    });
    fireEvent.change(form.getByLabelText('Plain-text body'), {
      target: { value: '$notice' },
    });
    fireEvent.click(form.getByRole('button', { name: 'Create template' }));

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/email-templates/ops_incident'
      )
    );
    expect(listState.createTemplate).toHaveBeenCalledWith({
      templateCode: 'ops_incident',
      purpose: 'security_notification',
      allowedVariables: ['notice', 'ticket_id'],
      requiredVariables: ['notice'],
      subjectTemplate: 'Notice $ticket_id',
      htmlTemplate: '<p>$notice</p>',
      textTemplate: '$notice',
    });
    expect(showToast).toHaveBeenCalledWith(
      'Created Ops incident. Version 1 is active.',
      'success'
    );
  });

  it('validates the new template before calling the API', async () => {
    renderAt('/email-templates');
    fireEvent.click(screen.getByRole('button', { name: 'Create template' }));
    const form = within(await screen.findByRole('dialog'));

    fireEvent.change(form.getByLabelText('Code'), {
      target: { value: 'email_activation' },
    });
    fireEvent.click(form.getByRole('button', { name: 'Create template' }));

    expect(
      form.getByText('This code belongs to a built-in template.')
    ).toBeInTheDocument();
    expect(form.getByText('Subject is required.')).toBeInTheDocument();
    expect(listState.createTemplate).not.toHaveBeenCalled();
  });

  it('keeps the dialog open with the backend message when creation fails', async () => {
    listState = makeListState({
      createTemplate: vi
        .fn<UseEmailTemplatesReturn['createTemplate']>()
        .mockRejectedValue(new Error('Email template code already exists')),
    });
    renderAt('/email-templates');
    fireEvent.click(screen.getByRole('button', { name: 'Create template' }));
    const form = within(await screen.findByRole('dialog'));

    fireEvent.change(form.getByLabelText('Code'), {
      target: { value: 'ops_incident' },
    });
    fireEvent.change(form.getByLabelText('Subject'), {
      target: { value: 'Notice' },
    });
    fireEvent.change(form.getByLabelText('HTML body'), {
      target: { value: '<p>Hi</p>' },
    });
    fireEvent.change(form.getByLabelText('Plain-text body'), {
      target: { value: 'Hi' },
    });
    fireEvent.click(form.getByRole('button', { name: 'Create template' }));

    expect(await form.findByRole('alert')).toHaveTextContent(
      'Email template code already exists'
    );
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/email-templates'
    );
  });
});

describe('EmailTemplateEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    detailState = makeDetailState();
  });

  it('shows the friendly name while loading', () => {
    detailState = makeDetailState({ template: null, isLoading: true });
    renderAt('/email-templates/email_activation');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Email activation' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Save' })
    ).not.toBeInTheDocument();
    expect(setBreadcrumbLabel).toHaveBeenLastCalledWith('Email activation');
  });

  it('shows the backend error with a retry', () => {
    detailState = makeDetailState({
      template: null,
      error: 'Unknown email template: nope',
    });
    renderAt('/email-templates/nope');
    expect(
      screen.getByText('Unknown email template: nope')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(detailState.refetch).toHaveBeenCalledTimes(1);
  });

  it('renders the editor and publishes the breadcrumb label, without a back button', () => {
    renderAt('/email-templates/email_activation');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Back to/ })
    ).not.toBeInTheDocument();
    expect(setBreadcrumbLabel).toHaveBeenLastCalledWith('Email activation');
  });

  it('navigates freely while there are no unsaved changes', () => {
    renderAt('/email-templates/email_activation');
    fireEvent.click(screen.getByRole('link', { name: 'Users' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/users');
  });

  it('asks before leaving with unsaved changes', async () => {
    renderAt('/email-templates/email_activation');
    fireEvent.change(screen.getByRole('textbox', { name: 'HTML body' }), {
      target: { value: `${ACTIVATION_HTML}<p>Edited</p>` },
    });

    fireEvent.click(screen.getByRole('link', { name: 'Users' }));
    let dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('Discard unsaved changes?')
    ).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/email-templates/email_activation'
    );

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Keep editing' })
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(screen.getByRole('textbox', { name: 'HTML body' })).toHaveValue(
      `${ACTIVATION_HTML}<p>Edited</p>`
    );

    fireEvent.click(screen.getByRole('link', { name: 'Users' }));
    dialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Discard changes' })
    );
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/users')
    );
  });
});
