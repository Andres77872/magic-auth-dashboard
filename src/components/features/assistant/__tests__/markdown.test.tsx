import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Markdown } from '../markdown';
import { sanitizeUrl } from '@/utils/assistant/markdown';
afterEach(cleanup);
describe('assistant output rendering', () => {
  it('renders Markdown as text nodes and rejects executable URLs', () => {
    const { container } = render(
      <Markdown
        content={
          '# Review\n\n**Safe** <img src=x onerror=alert(1)>\n\n[attack](javascript:alert) [docs](https://example.com)'
        }
      />
    );
    expect(screen.getByRole('heading', { name: 'Review' })).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute(
      'rel',
      'noopener noreferrer nofollow'
    );
    expect(
      screen.queryByRole('link', { name: 'attack' })
    ).not.toBeInTheDocument();
    expect(sanitizeUrl('java\nscript:alert(1)')).toBeNull();
    expect(sanitizeUrl('data:text/html,test')).toBeNull();
  });
  it('bounds nested untrusted Markdown without discarding its text', () => {
    render(<Markdown content={`${'> '.repeat(500)}still readable`} />);
    expect(screen.getByText(/still readable/)).toBeInTheDocument();
  });
  it('renders the safe Mermaid subset without injected HTML', () => {
    render(
      <Markdown
        content={'```mermaid\nflowchart LR\nA[Users] --> B[Groups]\n```'}
      />
    );
    expect(
      screen.getByRole('img', { name: /Flowchart with 2 nodes/ })
    ).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Groups')).toBeInTheDocument();
  });
  it('renders chart fences with an accessible data view', () => {
    render(
      <Markdown
        content={
          '```chart\n{"type":"line","title":"Users","labels":["Monday","Tuesday"],"series":[{"name":"Active","values":[12,null]}],"unit":"count"}\n```'
        }
      />
    );
    expect(screen.getByRole('img', { name: 'Users' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Data table' }));
    expect(screen.getByRole('table', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });
  it('keeps incomplete artifacts pending and invalid ones inspectable', () => {
    const { rerender } = render(
      <Markdown content={'```chart\n{"type":"line"'} streaming />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Receiving chart');
    rerender(<Markdown content={'```chart\nnot valid JSON\n```'} />);
    expect(
      screen.getByText('The chart block is not valid JSON.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/not valid JSON/, { selector: 'code' })
    ).toBeInTheDocument();
  });
});
