import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmailTemplateEditor } from '../EmailTemplateEditor';

// Mocked so the editor renders without the real data layer. The factory builds
// its own fixture (vi.mock is hoisted, so it can't close over outer vars).
vi.mock('@/hooks/useEmailTemplates', () => {
  const TEMPLATE = {
    templateCode: 'email_activation',
    purpose: 'email_activation',
    subjectTemplate: 'Activate your $app_name email',
    source: 'code' as const,
    version: null,
    isCustomized: false,
    requiredVariables: ['activation_link'],
    allowedVariables: ['app_name', 'recipient_masked', 'activation_link'],
    htmlTemplate: '<p>$recipient_masked</p><a href="$activation_link">Activate</a>',
    textTemplate: 'Activate: $activation_link',
    default: {
      subjectTemplate: 'Activate your $app_name email',
      htmlTemplate: '<p>$recipient_masked</p><a href="$activation_link">Activate</a>',
      textTemplate: 'Activate: $activation_link',
    },
    versions: [],
  };
  return {
    useEmailTemplate: () => ({
      template: TEMPLATE,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      save: vi.fn(),
      preview: vi.fn().mockResolvedValue({ subject: 'Activate your Magic Auth email', html: '<p>x</p>', text: 'x' }),
      sendTest: vi.fn(),
      rollback: vi.fn(),
    }),
  };
});

vi.mock('@/hooks', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

describe('EmailTemplateEditor', () => {
  it('starts valid: Save disabled (clean), Send test enabled', () => {
    render(<EmailTemplateEditor templateCode="email_activation" />);
    expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Send test/i })).toBeEnabled();
  });

  it('on an invalid draft: announces errors and disables Save + Send test', () => {
    render(<EmailTemplateEditor templateCode="email_activation" />);

    // Unknown variable in the HTML body → dirty + invalid. (Target the textarea
    // by its current value; Radix keeps the inactive tab panel mounted-but-hidden,
    // so both bodies share the DOM and the aria-label isn't unique to getBy*.)
    const htmlBody = screen.getByDisplayValue(
      '<p>$recipient_masked</p><a href="$activation_link">Activate</a>'
    );
    fireEvent.change(htmlBody, {
      target: { value: '<p>$nope</p><a href="$activation_link">x</a>' },
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Unknown variable/i)).toBeInTheDocument();
    // Guard: don't let a test silently send the saved version instead of the draft.
    expect(screen.getByRole('button', { name: /Send test/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();
  });
});
