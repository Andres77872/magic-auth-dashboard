import { type ComponentProps } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuthAllowedUrlList } from '../OAuthAllowedUrlList';
import { validateAllowedUrl } from '../oauth-status';
import { oauthService } from '@/services/oauth.service';
import { useToast } from '@/hooks';
import type { OAuthAllowedUrl } from '@/types/oauth.types';

vi.mock('@/services/oauth.service', () => ({
  oauthService: { addBindingUrl: vi.fn(), removeBindingUrl: vi.fn() },
}));

vi.mock('@/hooks', () => ({
  useToast: vi.fn(),
}));

const showToast = vi.fn();
const mockedService = vi.mocked(oauthService);

const URLS: OAuthAllowedUrl[] = [
  { id: 'pau-1', kind: 'redirect_uri', url: 'https://app.example.com/auth/callback' },
  { id: 'pau-2', kind: 'return_origin', url: 'https://app.example.com' },
];

function renderList(
  props: Partial<ComponentProps<typeof OAuthAllowedUrlList>> = {},
): ComponentProps<typeof OAuthAllowedUrlList> {
  const merged: ComponentProps<typeof OAuthAllowedUrlList> = {
    projectHash: 'proj_1',
    connectionKey: 'google',
    urls: URLS,
    onChanged: vi.fn(),
    allowHttpLocalhost: false,
    ...props,
  };
  render(<OAuthAllowedUrlList {...merged} />);
  return merged;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useToast).mockReturnValue({ showToast });
  mockedService.addBindingUrl.mockResolvedValue({ success: true, message: 'ok' } as never);
});

describe('validateAllowedUrl', () => {
  it('accepts an https redirect URI with a path', () => {
    expect(validateAllowedUrl('redirect_uri', 'https://app.example.com/auth/callback')).toBeNull();
  });

  it('accepts an origin that is scheme + host + optional port', () => {
    expect(validateAllowedUrl('return_origin', 'https://app.example.com')).toBeNull();
    expect(validateAllowedUrl('return_origin', 'https://app.example.com:8443')).toBeNull();
  });

  it('rejects plain http outside development', () => {
    expect(validateAllowedUrl('redirect_uri', 'http://app.example.com/cb')).toMatch(/https/i);
    expect(validateAllowedUrl('redirect_uri', 'http://localhost:3000/cb')).toMatch(/https/i);
  });

  it('allows http on localhost only when development is explicitly permitted', () => {
    expect(
      validateAllowedUrl('redirect_uri', 'http://localhost:3000/cb', { allowHttpLocalhost: true }),
    ).toBeNull();
    expect(
      validateAllowedUrl('redirect_uri', 'http://app.example.com/cb', {
        allowHttpLocalhost: true,
      }),
    ).toMatch(/https/i);
  });

  it('rejects wildcards', () => {
    expect(validateAllowedUrl('redirect_uri', 'https://*.example.com/cb')).toMatch(/wildcard/i);
    expect(validateAllowedUrl('return_origin', 'https://example.com*')).toMatch(/wildcard/i);
  });

  it('rejects fragments', () => {
    expect(validateAllowedUrl('redirect_uri', 'https://app.example.com/cb#frag')).toMatch(
      /fragment/i,
    );
    expect(validateAllowedUrl('redirect_uri', 'https://app.example.com/cb#')).toMatch(/fragment/i);
  });

  it('rejects embedded credentials', () => {
    expect(validateAllowedUrl('redirect_uri', 'https://user:pass@app.example.com/cb')).toMatch(
      /credential/i,
    );
  });

  it('rejects an origin that carries a path, a query or a trailing slash', () => {
    expect(validateAllowedUrl('return_origin', 'https://app.example.com/callback')).toMatch(
      /scheme:\/\/host/i,
    );
    expect(validateAllowedUrl('return_origin', 'https://app.example.com?x=1')).toMatch(
      /scheme:\/\/host/i,
    );
    expect(validateAllowedUrl('return_origin', 'https://app.example.com/')).toMatch(/slash/i);
  });

  it('rejects a relative or empty value', () => {
    expect(validateAllowedUrl('redirect_uri', '/auth/callback')).toMatch(/absolute/i);
    expect(validateAllowedUrl('redirect_uri', '   ')).toMatch(/enter a url/i);
  });
});

describe('OAuthAllowedUrlList', () => {
  it('renders one row per URL with its kind', () => {
    renderList();

    expect(screen.getByText('https://app.example.com/auth/callback')).toBeInTheDocument();
    expect(screen.getByText('https://app.example.com')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('blocks an invalid URL client-side and never calls the API', async () => {
    renderList();

    fireEvent.change(screen.getByLabelText('Redirect URI', { selector: 'input' }), {
      target: { value: 'https://*.example.com/cb' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add url/i }));

    expect(await screen.findByText(/must not contain wildcards/i)).toBeInTheDocument();
    expect(mockedService.addBindingUrl.mock.calls).toHaveLength(0);
  });

  it('adds a valid URL and clears the field', async () => {
    const { onChanged } = renderList();

    const input = screen.getByLabelText('Redirect URI', { selector: 'input' });
    fireEvent.change(input, { target: { value: 'https://app.example.com/oauth/callback' } });
    fireEvent.click(screen.getByRole('button', { name: /add url/i }));

    await waitFor(() =>
      expect(mockedService.addBindingUrl.mock.calls[0]).toEqual([
        'proj_1',
        'google',
        { kind: 'redirect_uri', url: 'https://app.example.com/oauth/callback' },
      ]),
    );
    await waitFor(() => expect(input).toHaveValue(''));
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('explains that sign-in needs both URL kinds when the list is empty', () => {
    renderList({ urls: [] });

    expect(screen.getByText(/both a redirect uri and a return origin/i)).toBeInTheDocument();
  });
});
