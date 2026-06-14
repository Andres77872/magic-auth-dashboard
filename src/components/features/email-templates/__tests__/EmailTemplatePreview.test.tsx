import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EmailTemplatePreview } from '../EmailTemplatePreview';

describe('EmailTemplatePreview', () => {
  it('renders the HTML inside a fully sandboxed iframe (the XSS boundary)', () => {
    const html = '<p>Hello $app_name</p><script>window.__pwned = true;</script>';
    const { container } = render(<EmailTemplatePreview html={html} />);

    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    // Empty sandbox => no scripts, no same-origin: the sole XSS boundary.
    expect(iframe?.getAttribute('sandbox')).toBe('');
    // HTML is passed via srcdoc, never via dangerouslySetInnerHTML.
    expect(iframe?.getAttribute('srcdoc')).toContain('Hello $app_name');

    // The raw script must not have been injected into the dashboard DOM.
    expect(container.querySelector('script')).toBeNull();
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
  });

  it('shows a placeholder while loading with no html yet', () => {
    const { getByText } = render(<EmailTemplatePreview html="" isLoading />);
    expect(getByText(/Rendering preview/i)).toBeTruthy();
  });
});
