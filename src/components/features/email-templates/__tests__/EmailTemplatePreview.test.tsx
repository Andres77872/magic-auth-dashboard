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

  it('shows the rendered subject line above the body', () => {
    const { getByText } = render(
      <EmailTemplatePreview html="<p>hi</p>" subject="Activate your Magic Auth email" />
    );
    expect(getByText('Activate your Magic Auth email')).toBeTruthy();
  });

  it('renders the plain-text body (not an iframe) in text mode', () => {
    const { container, getByText } = render(
      <EmailTemplatePreview html="<p>ignored</p>" text="Plain text body line" mode="text" />
    );
    expect(container.querySelector('iframe')).toBeNull();
    expect(getByText('Plain text body line')).toBeTruthy();
  });

  it('keeps the last render visible and shows a non-destructive error banner', () => {
    const { container, getByText } = render(
      <EmailTemplatePreview html="<p>last good</p>" error="Preview failed: 500" />
    );
    // The toolbar + iframe survive; the error is an in-pane banner.
    expect(container.querySelector('iframe')).not.toBeNull();
    expect(getByText(/Preview failed: 500/)).toBeTruthy();
  });

  it('overlays an out-of-date notice when paused', () => {
    const { getByText } = render(<EmailTemplatePreview html="<p>stale</p>" paused />);
    expect(getByText(/Preview paused/i)).toBeTruthy();
  });
});
