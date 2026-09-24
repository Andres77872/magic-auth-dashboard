import { type ComponentProps } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuthAllowedUrlList } from '../OAuthAllowedUrlList';
import { validateAllowedUrl } from '../oauth-status';
import type { OAuthAllowedUrl } from '@/types/oauth.types';

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ showToast }) }));
// CopyableId reads the toast hook from the barrel.
vi.mock('@/hooks', () => ({ useToast: () => ({ showToast }) }));

const URLS: OAuthAllowedUrl[] = [
  {
    id: 'pau-1',
    kind: 'redirect_uri',
    url: 'https://app.example.com/auth/callback',
  },
  { id: 'pau-2', kind: 'return_origin', url: 'https://app.example.com' },
];

type Props = ComponentProps<typeof OAuthAllowedUrlList>;

function renderList(props: Partial<Props> = {}): Props {
  const merged: Props = {
    connectionKey: 'google',
    urls: URLS,
    onAdd: vi.fn<Props['onAdd']>().mockResolvedValue(undefined),
    onRemove: vi.fn<Props['onRemove']>().mockResolvedValue(undefined),
    allowHttpLocalhost: false,
    ...props,
  };
  render(<OAuthAllowedUrlList {...merged} />);
  return merged;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('validateAllowedUrl', () => {
  it('accepts an https redirect URI with a path', () => {
    expect(
      validateAllowedUrl(
        'redirect_uri',
        'https://app.example.com/auth/callback'
      )
    ).toBeNull();
  });

  it('accepts an origin that is scheme + host + optional port', () => {
    expect(
      validateAllowedUrl('return_origin', 'https://app.example.com')
    ).toBeNull();
    expect(
      validateAllowedUrl('return_origin', 'https://app.example.com:8443')
    ).toBeNull();
  });

  it('rejects plain http outside development', () => {
    expect(
      validateAllowedUrl('redirect_uri', 'http://app.example.com/cb')
    ).toMatch(/https/i);
    expect(
      validateAllowedUrl('redirect_uri', 'http://localhost:3000/cb')
    ).toMatch(/https/i);
  });

  it('allows http on localhost only when development is explicitly permitted', () => {
    expect(
      validateAllowedUrl('redirect_uri', 'http://localhost:3000/cb', {
        allowHttpLocalhost: true,
      })
    ).toBeNull();
    expect(
      validateAllowedUrl('redirect_uri', 'http://app.example.com/cb', {
        allowHttpLocalhost: true,
      })
    ).toMatch(/https/i);
  });

  it('rejects wildcards, fragments and embedded credentials', () => {
    expect(
      validateAllowedUrl('redirect_uri', 'https://*.example.com/cb')
    ).toMatch(/wildcard/i);
    expect(
      validateAllowedUrl('redirect_uri', 'https://app.example.com/cb#frag')
    ).toMatch(/fragment/i);
    expect(
      validateAllowedUrl('redirect_uri', 'https://app.example.com/cb#')
    ).toMatch(/fragment/i);
    expect(
      validateAllowedUrl('redirect_uri', 'https://user:pass@app.example.com/cb')
    ).toMatch(/credential/i);
  });

  it('rejects an origin that carries a path, a query or a trailing slash', () => {
    expect(
      validateAllowedUrl('return_origin', 'https://app.example.com/callback')
    ).toMatch(/scheme:\/\/host/i);
    expect(
      validateAllowedUrl('return_origin', 'https://app.example.com?x=1')
    ).toMatch(/scheme:\/\/host/i);
    expect(
      validateAllowedUrl('return_origin', 'https://app.example.com/')
    ).toMatch(/slash/i);
  });

  it('rejects a relative or empty value', () => {
    expect(validateAllowedUrl('redirect_uri', '/auth/callback')).toMatch(
      /absolute/i
    );
    expect(validateAllowedUrl('redirect_uri', '   ')).toMatch(/enter a url/i);
  });
});

describe('OAuthAllowedUrlList', () => {
  it('renders one row per URL with its kind', () => {
    renderList();

    const list = screen.getByRole('list', { name: 'Allowed URLs' });
    expect(list.querySelectorAll('li')).toHaveLength(2);
    expect(
      screen.getByText('https://app.example.com/auth/callback')
    ).toBeInTheDocument();
    expect(screen.getByText('https://app.example.com')).toBeInTheDocument();
  });

  it('blocks an invalid URL client-side and never calls the API', async () => {
    const { onAdd } = renderList();

    fireEvent.change(
      screen.getByLabelText('Redirect URI', { selector: 'input' }),
      {
        target: { value: 'https://*.example.com/cb' },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: /add url/i }));

    expect(
      await screen.findByText(/must not contain wildcards/i)
    ).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('adds a valid URL, clears the field and confirms only after the API resolved', async () => {
    const { onAdd } = renderList();

    const input = screen.getByLabelText('Redirect URI', { selector: 'input' });
    fireEvent.change(input, {
      target: { value: ' https://app.example.com/oauth/callback ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add url/i }));

    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith({
        kind: 'redirect_uri',
        url: 'https://app.example.com/oauth/callback',
      })
    );
    await waitFor(() => expect(input).toHaveValue(''));
    expect(showToast).toHaveBeenCalledWith('Redirect URI added', 'success');
  });

  it('keeps the value and shows the backend message when adding fails', async () => {
    const onAdd = vi
      .fn<Props['onAdd']>()
      .mockRejectedValue(new Error('Redirect URI must use https'));
    renderList({ onAdd });

    const input = screen.getByLabelText('Redirect URI', { selector: 'input' });
    fireEvent.change(input, {
      target: { value: 'https://app.example.com/cb' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add url/i }));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        'Redirect URI must use https',
        'error'
      )
    );
    expect(input).toHaveValue('https://app.example.com/cb');
  });

  it('asks for confirmation before removing a URL', async () => {
    const { onRemove } = renderList();

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove https://app.example.com' })
    );
    expect(
      await screen.findByText('Remove this return origin?')
    ).toBeInTheDocument();
    expect(onRemove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Remove URL' }));
    await waitFor(() => expect(onRemove).toHaveBeenCalledWith('pau-2'));
  });

  it('says which URL kinds are still missing', () => {
    renderList({ urls: [URLS[0]] });
    expect(
      screen.getByText(/until this binding has a return origin/i)
    ).toBeInTheDocument();
  });

  it('explains that sign-in needs both URL kinds when the list is empty', () => {
    renderList({ urls: [] });
    expect(
      screen.getByText(/a redirect uri and a return origin/i)
    ).toBeInTheDocument();
  });
});
