import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AssistantBootstrap } from '@/types/assistant.types';
import AssistantPanel from '../AssistantPanel';
import { AssistantSettings } from '../AssistantSettings';

const mocks = vi.hoisted(() => ({ useAuth: vi.fn(), useAssistant: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mocks.useAuth }));
vi.mock('@/hooks/useAssistant', () => ({ useAssistant: mocks.useAssistant }));
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
  });
  Object.defineProperty(Element.prototype, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  });
});
afterEach(() => {
  cleanup();
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
    const dialog = screen.getByRole('dialog', { name: 'AI assistant Root' });
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
    fireEvent.click(screen.getByText('Users', { selector: 'summary' }));
    expect(screen.getByRole('switch', { name: 'List users' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Delete user' })).toBeDisabled();
  });
});
