import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EmailTemplatePreview } from '../EmailTemplatePreview';

describe('EmailTemplatePreview', () => {
  it('renders the HTML inside a fully sandboxed iframe (the XSS boundary)', () => {
    const html =
      '<p>Hello $app_name</p><script>window.__pwned = true;</script>';
    const { container } = render(<EmailTemplatePreview html={html} />);

    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    // Empty sandbox => no scripts, no same-origin.
    expect(iframe?.getAttribute('sandbox')).toBe('');
    // HTML is passed via srcdoc, never injected into the dashboard DOM.
    expect(iframe?.getAttribute('srcdoc')).toContain('Hello $app_name');
    expect(container.querySelector('script')).toBeNull();
    expect((window as Window & { __pwned?: boolean }).__pwned).toBeUndefined();
  });

  it('sits in a Preview panel', () => {
    render(<EmailTemplatePreview html="<p>hi</p>" />);
    expect(
      screen.getByRole('heading', { name: 'Preview' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('HTML body rendered with sample data')
    ).toBeInTheDocument();
  });

  it('shows a placeholder while the first render loads', () => {
    render(<EmailTemplatePreview html="" isLoading />);
    expect(screen.getByText(/Rendering preview/i)).toBeInTheDocument();
  });

  it('keeps the last render and shows an updating hint while re-rendering', () => {
    const { container } = render(
      <EmailTemplatePreview html="<p>last</p>" isLoading />
    );
    expect(container.querySelector('iframe')).not.toBeNull();
    expect(screen.getByText('Updating')).toBeInTheDocument();
  });

  it('shows the rendered subject line above the body', () => {
    render(
      <EmailTemplatePreview
        html="<p>hi</p>"
        subject="Activate your Magic Auth email"
      />
    );
    expect(
      screen.getByText('Activate your Magic Auth email')
    ).toBeInTheDocument();
  });

  it('renders the plain-text body (not an iframe) in text mode, without width controls', () => {
    const { container } = render(
      <EmailTemplatePreview
        html="<p>ignored</p>"
        text="Plain text body line"
        mode="text"
      />
    );
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByText('Plain text body line')).toBeInTheDocument();
    expect(
      screen.queryByRole('tablist', { name: 'Preview width' })
    ).not.toBeInTheDocument();
  });

  it('switches to the mobile width with the segmented control', () => {
    const { container } = render(<EmailTemplatePreview html="<p>hi</p>" />);
    fireEvent.click(screen.getByRole('tab', { name: 'Mobile' }));
    expect(screen.getByRole('tab', { name: 'Mobile' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(container.querySelector('iframe')?.style.maxWidth).toBe('390px');
  });

  it('keeps the last render visible and shows a non-destructive error banner', () => {
    const { container } = render(
      <EmailTemplatePreview
        html="<p>last good</p>"
        error="Preview failed: 500"
      />
    );
    expect(container.querySelector('iframe')).not.toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('Preview failed: 500');
  });

  it('overlays an out-of-date notice when paused', () => {
    render(<EmailTemplatePreview html="<p>stale</p>" paused />);
    expect(screen.getByText(/Preview paused/i)).toBeInTheDocument();
  });
});
