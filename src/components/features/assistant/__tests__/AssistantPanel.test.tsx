import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AssistantBootstrap,
  AssistantEvent,
  AssistantSession,
  AssistantSnapshot,
} from '@/types/assistant.types';
import type { useAssistant as useAssistantType } from '@/hooks/useAssistant';
import AssistantPanel from '../AssistantPanel';
import { AssistantSettings } from '../AssistantSettings';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useAssistant: vi.fn(),
  showToast: vi.fn(),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mocks.useAuth }));
vi.mock('@/hooks/useAssistant', () => ({ useAssistant: mocks.useAssistant }));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
const data: AssistantBootstrap = {
  settings: {
    enabled: true,
    mutations_enabled: false,
    enabled_skills: ['users'],
    enabled_tools: ['users__list'],
    features: { planning: true, memory: true, ask_user: true, subagents: true },
    default_profile_id: 'p1',
  },
  profiles: [
    {
      id: 'p1',
      name: 'Local Ollama',
      provider: 'ollama',
      base_url: 'http://localhost:11434',
      model: 'qwen3:8b',
      enabled: true,
      has_api_key: false,
    },
  ],
  skills: [
    {
      id: 'users',
      name: 'Users',
      description: 'User management',
      tools: ['users__list', 'users__delete'],
    },
  ],
  tools: [
    {
      id: 'users__list',
      name: 'users__list',
      description: 'List users',
      skill_id: 'users',
      mutating: false,
      method: 'GET',
      path: '/users',
      default_enabled: true,
    },
    {
      id: 'users__delete',
      name: 'users__delete',
      description: 'Delete user',
      skill_id: 'users',
      mutating: true,
      method: 'DELETE',
      path: '/users/{user}',
      default_enabled: false,
    },
  ],
  sessions: [],
  runtime_available: true,
};
const cancel = vi.fn();
beforeEach(() => {
  localStorage.clear();
  cancel.mockResolvedValue(undefined);
  // Radix switches inside forms measure themselves.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
  );
  mocks.useAuth.mockReturnValue({
    isAuthenticated: true,
    userType: 'root',
    user: { user_hash: 'root-1' },
    refreshSession: vi.fn(),
  });
  mocks.useAssistant.mockReturnValue({
    connectionState: 'connected',
    bootstrap: data,
    snapshot: null,
    snapshotSeq: 0,
    error: null,
    busy: false,
    cancel,
    send: vi.fn().mockResolvedValue(true),
    createSession: vi.fn(),
    selectSession: vi.fn(),
    updateSettings: vi.fn(),
    saveProfile: vi.fn(),
    deleteProfile: vi.fn(),
    dismissError: vi.fn(),
    retryConnection: vi.fn(),
  });
  Object.defineProperty(Element.prototype, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
describe('root assistant access and panel', () => {
  it('does not initialize assistant access for admins or signed-out users', () => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: true,
      userType: 'admin',
      user: { user_hash: 'admin-1' },
    });
    const { rerender } = render(<AssistantPanel />);
    expect(
      screen.queryByRole('button', { name: 'Open AI assistant' })
    ).not.toBeInTheDocument();
    expect(mocks.useAssistant).not.toHaveBeenCalled();
    mocks.useAuth.mockReturnValue({
      isAuthenticated: false,
      userType: null,
      user: null,
    });
    rerender(<AssistantPanel />);
    expect(mocks.useAssistant).not.toHaveBeenCalled();
  });
  it('opens, resizes by keyboard, and closes without cancelling backend execution', () => {
    render(<AssistantPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Open AI assistant' }));
    const dialog = screen.getByRole('dialog', { name: 'AI assistant' });
    expect(dialog).toBeInTheDocument();
    fireEvent.keyDown(
      screen.getByRole('button', { name: 'Resize assistant' }),
      { key: 'ArrowLeft' }
    );
    expect(localStorage.getItem('assistant.panel.root-1')).toContain(
      '"width":520'
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Close assistant (keep running)' })
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(cancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Open AI assistant' }));
    expect(localStorage.getItem('assistant.panel.root-1')).toContain(
      '"width":520'
    );
  });
  it('restores each conversation connection and unsent draft independently', () => {
    const state = mocks.useAssistant() as ReturnType<
      typeof import('@/hooks/useAssistant').useAssistant
    >;
    const connections = [
      { ...data.profiles[0], id: 'p2', name: 'Second provider' },
      data.profiles[0],
    ];
    const session = {
      id: 's1',
      title: 'First',
      status: 'idle' as const,
      profile_id: 'p1',
      created_at: 1,
      updated_at: 1,
    };
    const first = {
      session,
      messages: [],
      events: [],
      run: null,
      partial_content: '',
      last_seq: 0,
      has_older_messages: false,
    };
    mocks.useAssistant.mockReturnValue({
      ...state,
      bootstrap: { ...data, profiles: connections },
      snapshot: first,
    });
    const { rerender } = render(<AssistantPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Open AI assistant' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'AI connection' }), {
      target: { value: 'p2' },
    });
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Message the assistant' }),
      { target: { value: 'Draft for first conversation' } }
    );
    mocks.useAssistant.mockReturnValue({
      ...state,
      bootstrap: { ...data, profiles: connections },
      snapshot: { ...first, session: { ...session, id: 's2' } },
    });
    rerender(<AssistantPanel />);
    expect(screen.getByRole('combobox', { name: 'AI connection' })).toHaveValue(
      'p1'
    );
    expect(
      screen.getByRole('textbox', { name: 'Message the assistant' })
    ).toHaveValue('');
    mocks.useAssistant.mockReturnValue({
      ...state,
      bootstrap: { ...data, profiles: connections },
      snapshot: first,
    });
    rerender(<AssistantPanel />);
    expect(screen.getByRole('combobox', { name: 'AI connection' })).toHaveValue(
      'p2'
    );
    expect(
      screen.getByRole('textbox', { name: 'Message the assistant' })
    ).toHaveValue('Draft for first conversation');
  });
  it('shows connection diagnostics and provider setup instead of a chat that cannot load', () => {
    const state = mocks.useAssistant() as ReturnType<
      typeof import('@/hooks/useAssistant').useAssistant
    >;
    const retry = vi.fn();
    mocks.useAssistant.mockReturnValue({
      ...state,
      bootstrap: null,
      connectionState: 'reconnecting',
      retryConnection: retry,
    });
    render(<AssistantPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Open AI assistant' }));
    expect(
      screen.getByRole('heading', { name: 'Assistant connection unavailable' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Where to configure your AI provider',
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Message the assistant' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Connection details'));
    expect(
      screen.getByText(/API must run with WebSocket support/)
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Retry connection' }));
    expect(retry).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Assistant settings' }));
    expect(
      screen.getByText('Assistant connection unavailable')
    ).toBeInTheDocument();
    expect(state.updateSettings).not.toHaveBeenCalled();
  });
  it('provides a visible route to provider settings when the assistant is disabled', () => {
    const state = mocks.useAssistant() as ReturnType<
      typeof import('@/hooks/useAssistant').useAssistant
    >;
    mocks.useAssistant.mockReturnValue({
      ...state,
      bootstrap: { ...data, settings: { ...data.settings, enabled: false } },
    });
    render(<AssistantPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Open AI assistant' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Open provider settings' })
    );
    expect(
      screen.getByRole('heading', { name: 'Connections' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add connection' })
    ).toBeInTheDocument();
    expect(state.updateSettings).not.toHaveBeenCalled();
  });
  it('keeps write access visible even while the chat is closed', () => {
    mocks.useAssistant.mockReturnValue({
      ...mocks.useAssistant(),
      bootstrap: {
        ...data,
        settings: { ...data.settings, mutations_enabled: true },
      },
    });
    render(<AssistantPanel />);
    expect(screen.getByLabelText('Write tools active')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open AI assistant' }));
    expect(screen.getByText('Write access is active')).toBeInTheDocument();
  });
});
describe('capability settings', () => {
  it('requires an explicit warning confirmation before enabling changes', () => {
    const update = vi.fn().mockResolvedValue(true);
    render(
      <AssistantSettings
        data={data}
        busy={false}
        update={update}
        saveProfile={vi.fn()}
        deleteProfile={vi.fn()}
      />
    );
    fireEvent.click(
      screen.getByRole('switch', { name: 'Allow tools that change app data' })
    );
    expect(screen.getByText('Enable write access?')).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Enable write access' })
    );
    expect(update).toHaveBeenCalledWith({ mutations_enabled: true });
  });
  it('shows reads enabled and keeps individual write tools disabled until write access is active', () => {
    render(
      <AssistantSettings
        data={data}
        busy={false}
        update={vi.fn()}
        saveProfile={vi.fn()}
        deleteProfile={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Users', { selector: 'summary span' }));
    expect(screen.getByRole('switch', { name: 'List users' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Delete user' })).toBeDisabled();
  });
});
describe('run feedback', () => {
  const session = {
    id: 's1',
    title: 'Access review',
    status: 'running' as const,
    profile_id: 'p1',
    created_at: 1,
    updated_at: 1,
  };
  const event = (
    seq: number,
    kind: string,
    data: Record<string, unknown>
  ): AssistantEvent => ({
    type: 'event',
    session_id: 's1',
    seq,
    kind,
    data: { run_id: 'r1', ...data },
    created_at: 100 + seq,
  });
  const withSnapshot = (
    run: AssistantSnapshot['run'],
    events: AssistantEvent[] = [],
    overrides: Partial<ReturnType<typeof useAssistantType>> = {}
  ): ReturnType<typeof useAssistantType> => {
    const state = mocks.useAssistant() as ReturnType<typeof useAssistantType>;
    const status: AssistantSession['status'] = run?.status ?? 'idle';
    const next = {
      ...state,
      resume: vi.fn().mockResolvedValue(undefined),
      bootstrap: {
        ...data,
        sessions: [{ ...session, status }],
      },
      snapshot: {
        session: { ...session, status },
        messages: [
          {
            id: 'm1',
            role: 'user' as const,
            content: 'List admins',
            created_at: 100,
          },
        ],
        events,
        run,
        partial_content: '',
        last_seq: events.at(-1)?.seq ?? 0,
        has_older_messages: false,
      },
      snapshotSeq: events.at(-1)?.seq ?? 0,
      ...overrides,
    };
    mocks.useAssistant.mockReturnValue(next);
    return next;
  };
  const open = (): void => {
    render(<AssistantPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Open AI assistant' }));
  };

  it('shows live progress with readable step names and swaps Send for Stop', () => {
    const state = withSnapshot({ id: 'r1', status: 'running' }, [
      event(1, 'run.status', { status: 'running' }),
      event(2, 'task.updated', {
        todos: [{ content: 'Find admins', status: 'in_progress' }],
      }),
      event(3, 'tool.started', { id: 't1', name: 'users__list' }),
    ]);
    open();
    const progress = screen.getByRole('region', { name: 'Assistant progress' });
    expect(progress).toHaveTextContent('List users');
    expect(progress).toHaveTextContent('Find admins');
    expect(
      screen.getByRole('option', { name: 'Access review · Working' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Send message' })
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Stop the current run' })
    );
    expect(state.cancel).toHaveBeenCalledOnce();
  });

  it('offers retry and edit for a failed run', () => {
    const state = withSnapshot({
      id: 'r1',
      status: 'failed',
      error: 'Model not found',
    });
    open();
    expect(screen.getByText('The run failed')).toBeInTheDocument();
    expect(screen.getByText('Model not found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit message' }));
    expect(
      screen.getByRole('textbox', { name: 'Message the assistant' })
    ).toHaveValue('List admins');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(state.send).toHaveBeenCalledWith('List admins', 'p1');
  });

  it('approves a single proposed change in one step with readable arguments', () => {
    const interrupt = {
      interrupts: [
        {
          id: 'i1',
          value: {
            action_requests: [
              {
                name: 'users__delete',
                args: { user_hash: 'usr-abc' },
                description: 'Delete alice',
              },
            ],
          },
        },
      ],
    };
    const state = withSnapshot(
      { id: 'r1', status: 'waiting_input', interrupt },
      [event(1, 'interrupt', interrupt)]
    );
    open();
    expect(screen.getByText('Approve this change?')).toBeInTheDocument();
    expect(screen.getByText('Delete user')).toBeInTheDocument();
    expect(screen.getByText('usr-abc')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Approve and continue' })
    );
    expect(state.resume).toHaveBeenCalledWith(undefined, undefined, {
      i1: { decisions: [{ type: 'approve' }] },
    });
  });

  it('sends an optional reason when rejecting a change', () => {
    const interrupt = {
      interrupts: [
        {
          id: 'i1',
          value: {
            action_requests: [{ name: 'users__delete', args: {} }],
          },
        },
      ],
    };
    const state = withSnapshot({
      id: 'r1',
      status: 'waiting_input',
      interrupt,
    });
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Reject…' }));
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Reason for rejecting (optional)' }),
      { target: { value: 'Wrong user' } }
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Reject and continue' })
    );
    expect(state.resume).toHaveBeenCalledWith(undefined, undefined, {
      i1: { decisions: [{ type: 'reject', message: 'Wrong user' }] },
    });
  });

  it('answers a clarification with one click on an option', () => {
    const interrupt = {
      interrupts: [
        {
          id: 'i2',
          value: {
            type: 'ask_user',
            question: 'Which project?',
            options: ['Billing', 'Mobile'],
          },
        },
      ],
    };
    const state = withSnapshot({
      id: 'r1',
      status: 'waiting_input',
      interrupt,
    });
    open();
    expect(screen.getByText('Which project?')).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Message the assistant' })
    ).toHaveAttribute(
      'placeholder',
      'Respond to the request above to continue…'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Mobile' }));
    expect(state.resume).toHaveBeenCalledWith(undefined, undefined, {
      i2: { answer: 'Mobile' },
    });
  });

  it('flags a reply that finished while the panel was closed', () => {
    withSnapshot({ id: 'r1', status: 'running' });
    const { rerender } = render(<AssistantPanel />);
    expect(screen.getByText('Working')).toBeInTheDocument();
    withSnapshot({ id: 'r1', status: 'completed' });
    rerender(<AssistantPanel />);
    expect(screen.getByText('New reply')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open AI assistant' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Close assistant (keep running)' })
    );
    expect(screen.queryByText('New reply')).not.toBeInTheDocument();
  });

  it('confirms saved connections with a toast', async () => {
    const saveProfile = vi.fn().mockResolvedValue(true);
    withSnapshot(null, [], { saveProfile });
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Assistant settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Local Ollama' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save connection' }));
    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledWith(
        'Connection updated',
        'success'
      )
    );
    expect(saveProfile).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p1', name: 'Local Ollama' })
    );
  });
});
describe('connection editor', () => {
  it('explains the provider host allowlist when a custom host is rejected', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      }
    );
    const saveProfile = vi.fn().mockResolvedValue(false);
    render(
      <AssistantSettings
        data={data}
        busy={false}
        update={vi.fn()}
        saveProfile={saveProfile}
        deleteProfile={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add connection' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'API format' }), {
      target: { value: 'openai' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /Base URL/ }), {
      target: { value: 'https://api.together.xyz/v1' },
    });
    expect(
      screen.getByText(/only accepts api\.together\.xyz if it is listed/)
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: /Connection name/ }), {
      target: { value: 'Together' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /Model/ }), {
      target: { value: 'Qwen/Qwen3' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save connection' }));
    expect(
      await screen.findByText('The API server did not save this connection.')
    ).toBeInTheDocument();
    expect(saveProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'openai',
        base_url: 'https://api.together.xyz/v1',
      })
    );
    expect(
      screen.getByRole('form', { name: 'New connection' })
    ).toBeInTheDocument();
  });
});
