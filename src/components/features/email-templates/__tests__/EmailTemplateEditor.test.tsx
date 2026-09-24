import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  EmailTemplateEditor,
  type EmailTemplateEditorProps,
} from '../EmailTemplateEditor';
import { ACTIVATION_HTML, makeCustomizedDetail, makeDetail } from './fixtures';
import type {
  EmailTemplateDraft,
  EmailTemplatePreview,
} from '@/types/email-templates.types';

const showToast = vi.fn();
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ showToast }) }));

const previewState: {
  preview: EmailTemplatePreview | null;
  isLoading: boolean;
  error: string | null;
} = {
  preview: null,
  isLoading: false,
  error: null,
};
const usePreview = vi.fn(
  (
    code: string,
    draft: EmailTemplateDraft,
    options?: { enabled?: boolean }
  ) => {
    void code;
    void draft;
    void options;
    return previewState;
  }
);
vi.mock('@/hooks/useEmailTemplates', () => ({
  useEmailTemplatePreview: (
    code: string,
    draft: EmailTemplateDraft,
    options?: { enabled?: boolean }
  ) => usePreview(code, draft, options),
}));

beforeAll(() => {
  // Radix menus measure their trigger; jsdom has no ResizeObserver.
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

function setup(
  overrides: Partial<EmailTemplateEditorProps> = {}
): EmailTemplateEditorProps {
  const props: EmailTemplateEditorProps = {
    template: makeDetail(),
    onSave: vi.fn<EmailTemplateEditorProps['onSave']>().mockResolvedValue(3),
    onRollback: vi
      .fn<EmailTemplateEditorProps['onRollback']>()
      .mockResolvedValue(undefined),
    onDisable: vi
      .fn<EmailTemplateEditorProps['onDisable']>()
      .mockResolvedValue(undefined),
    onSendTest: vi
      .fn<EmailTemplateEditorProps['onSendTest']>()
      .mockResolvedValue({
        recipientMasked: 'r***@example.com',
        provider: 'fake',
      }),
    onDirtyChange: vi.fn(),
    ...overrides,
  };
  render(<EmailTemplateEditor {...props} />);
  return props;
}

function htmlBody(): HTMLElement {
  return screen.getByRole('textbox', { name: 'HTML body' });
}

function openMoreActions(): void {
  fireEvent.keyDown(
    screen.getByRole('button', { name: 'More template actions' }),
    { key: 'Enter' }
  );
}

describe('EmailTemplateEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    previewState.preview = null;
    previewState.isLoading = false;
    previewState.error = null;
  });

  it('shows the template name, status and source in the header', () => {
    setup();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Email activation' })
    ).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Built-in default')).toBeInTheDocument();
    expect(screen.getByText('email_activation')).toBeInTheDocument();
  });

  it('starts clean: Save disabled, Send test enabled, preview requested for the valid draft', () => {
    const props = setup();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Send test/ })).toBeEnabled();
    expect(props.onDirtyChange).toHaveBeenLastCalledWith(false);
    expect(usePreview).toHaveBeenLastCalledWith(
      'email_activation',
      expect.objectContaining({ htmlTemplate: ACTIVATION_HTML }),
      { enabled: true }
    );
  });

  it('on an invalid draft: announces the problems, pauses the preview and blocks Save + Send test', () => {
    setup();
    fireEvent.change(htmlBody(), {
      target: { value: '<p>$nope</p><a href="$activation_link">x</a>' },
    });

    expect(
      within(screen.getByRole('alert')).getByText(/Unknown variable/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Preview paused/)).toBeInTheDocument();
    expect(usePreview).toHaveBeenLastCalledWith(
      'email_activation',
      expect.anything(),
      { enabled: false }
    );
    // Guard: an invalid draft must not silently send the saved version instead.
    expect(screen.getByRole('button', { name: /Send test/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('saves a valid edit, then toasts the new version', async () => {
    const props = setup();
    fireEvent.change(htmlBody(), {
      target: { value: `${ACTIVATION_HTML}<p>Thanks</p>` },
    });
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(props.onDirtyChange).toHaveBeenLastCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        'Saved Email activation as version 3.',
        'success'
      )
    );
    expect(props.onSave).toHaveBeenCalledWith({
      subjectTemplate: 'Activate your $app_name email',
      htmlTemplate: `${ACTIVATION_HTML}<p>Thanks</p>`,
      textTemplate: 'Activate: $activation_link',
    });
  });

  it('shows the backend message when saving fails and keeps the draft', async () => {
    const props = setup({
      onSave: vi
        .fn<EmailTemplateEditorProps['onSave']>()
        .mockRejectedValue(new Error('unrecognized HTML tag <x>')),
    });
    fireEvent.change(htmlBody(), {
      target: { value: `${ACTIVATION_HTML}<p>More</p>` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        'unrecognized HTML tag <x>',
        'error'
      )
    );
    expect(props.onSave).toHaveBeenCalledTimes(1);
    expect(htmlBody()).toHaveValue(`${ACTIVATION_HTML}<p>More</p>`);
  });

  it('sends a test of the active version when clean and of the draft when dirty', async () => {
    const props = setup();
    fireEvent.click(screen.getByRole('button', { name: /Send test/ }));
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        'Test email sent to r***@example.com.',
        'success'
      )
    );
    expect(props.onSendTest).toHaveBeenLastCalledWith(undefined);

    fireEvent.change(htmlBody(), {
      target: { value: `${ACTIVATION_HTML}<p>Draft</p>` },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send test/ }));
    await waitFor(() => expect(props.onSendTest).toHaveBeenCalledTimes(2));
    expect(props.onSendTest).toHaveBeenLastCalledWith(
      expect.objectContaining({
        htmlTemplate: `${ACTIVATION_HTML}<p>Draft</p>`,
      })
    );
  });

  it('inserts a variable at the caret of the body being edited', () => {
    setup();
    const body = htmlBody() as HTMLTextAreaElement;
    fireEvent.focus(body);
    body.setSelectionRange(0, 0);
    fireEvent.click(screen.getByRole('button', { name: 'Insert $app_name' }));
    expect(body.value.startsWith('$app_name')).toBe(true);
  });

  it('switches between the HTML and plain-text bodies with a segmented control', () => {
    setup();
    fireEvent.click(screen.getByRole('tab', { name: 'Plain text' }));
    expect(
      screen.getByRole('textbox', { name: 'Plain-text body' })
    ).toHaveValue('Activate: $activation_link');
    expect(
      screen.queryByRole('textbox', { name: 'HTML body' })
    ).not.toBeInTheDocument();
  });

  it('lists version history and restores an older version after confirmation', async () => {
    const props = setup({ template: makeCustomizedDetail() });
    expect(screen.getByText('Customized')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Restore version 1' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Restore version 1?')).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Restore version' })
    );

    await waitFor(() => expect(props.onRollback).toHaveBeenCalledWith(1));
    expect(showToast).toHaveBeenCalledWith(
      'Version 1 is active again.',
      'success'
    );
  });

  it('shows the sample data returned with the preview', () => {
    previewState.preview = {
      subject: 'Activate your Magic Auth email',
      html: '<p>x</p>',
      text: 'x',
      sampleVariables: { app_name: 'Magic Auth' },
    };
    setup();
    const panel = screen
      .getByRole('heading', { name: 'Sample data' })
      .closest('section');
    expect(panel).not.toBeNull();
    const facts = within(panel as HTMLElement);
    expect(facts.getByText('$app_name')).toBeInTheDocument();
    expect(facts.getByText('Magic Auth')).toBeInTheDocument();
  });

  it('disables a built-in template only after typing its code', async () => {
    const props = setup();
    openMoreActions();
    fireEvent.click(
      await screen.findByRole('menuitem', { name: /Disable template/ })
    );

    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', {
      name: 'Disable template',
    });
    expect(confirm).toBeDisabled();
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: 'email_activation' },
    });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);

    await waitFor(() => expect(props.onDisable).toHaveBeenCalledTimes(1));
    expect(showToast).toHaveBeenCalledWith(
      'Email activation is disabled.',
      'success'
    );
  });

  it('loads the built-in default into the draft without saving', async () => {
    const props = setup({
      template: makeCustomizedDetail({
        htmlTemplate: '<p>$activation_link custom</p>',
      }),
    });
    openMoreActions();
    fireEvent.click(
      await screen.findByRole('menuitem', { name: /Load built-in default/ })
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Load default' })
    );

    expect(htmlBody()).toHaveValue(ACTIVATION_HTML);
    expect(props.onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('offers no built-in default for custom templates', () => {
    setup({
      template: makeCustomizedDetail({
        templateCode: 'ops_notice',
        isDynamic: true,
        builtInDefault: null,
      }),
    });
    openMoreActions();
    expect(
      screen.queryByRole('menuitem', { name: /Load built-in default/ })
    ).not.toBeInTheDocument();
  });

  it('explains a disabled template, blocks test sends and re-enables the stored version', async () => {
    const props = setup({
      template: makeCustomizedDetail({
        isEnabled: false,
        disabledAt: '2026-09-23T10:00:00Z',
      }),
    });
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByText(/This template is disabled/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send test/ })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Enable template' }));
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        'Email activation is enabled.',
        'success'
      )
    );
    expect(props.onRollback).toHaveBeenCalledWith(2);
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it('enables a disabled built-in default by saving it as a version, after confirmation', async () => {
    const props = setup({ template: makeDetail({ isEnabled: false }) });
    fireEvent.click(screen.getByRole('button', { name: 'Enable template' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Enable template' })
    );

    await waitFor(() =>
      expect(props.onSave).toHaveBeenCalledWith({
        subjectTemplate: 'Activate your $app_name email',
        htmlTemplate: ACTIVATION_HTML,
        textTemplate: 'Activate: $activation_link',
      })
    );
  });
});
