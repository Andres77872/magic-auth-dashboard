import { describe, it, expect } from 'vitest';
import { computeApiKeyStatus } from '../api-key.types';
import type { ApiKey } from '../api-key.types';

const NOW = Date.parse('2026-06-01T00:00:00Z');

function makeKey(overrides: Partial<ApiKey> = {}): ApiKey {
  return {
    id: 'pub-abc123',
    public_id: 'pub-abc123',
    name: 'Test key',
    description: null,
    project_id: 'proj-internal-1',
    owner_user_id: 'usr-internal-1',
    is_active: true,
    expires_at: null,
    last_used_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: null,
    revoked_at: null,
    revoke_reason: null,
    fingerprint: 'ABC123DEF456',
    secret_last4: 'xyz0',
    hash_algorithm: null,
    ...overrides,
  };
}

describe('computeApiKeyStatus', () => {
  it('is active for an active key with a future expiry', () => {
    expect(
      computeApiKeyStatus(makeKey({ expires_at: '2027-12-31T00:00:00Z' }), NOW)
    ).toBe('active');
  });

  it('is active for an active key that never expires', () => {
    expect(computeApiKeyStatus(makeKey({ expires_at: null }), NOW)).toBe(
      'active'
    );
  });

  it('is expired for an active key past its expiry that has not been swept yet', () => {
    expect(
      computeApiKeyStatus(makeKey({ expires_at: '2026-01-01T00:00:00Z' }), NOW)
    ).toBe('expired');
  });

  it('is revoked whenever revoked_at is set', () => {
    expect(
      computeApiKeyStatus(
        makeKey({ is_active: false, revoked_at: '2026-05-01T00:00:00Z' }),
        NOW
      )
    ).toBe('revoked');
  });

  it('is expired for an inactive key without revoked_at (deactivated after expiring)', () => {
    expect(
      computeApiKeyStatus(
        makeKey({
          is_active: false,
          revoked_at: null,
          expires_at: '2026-01-01T00:00:00Z',
        }),
        NOW
      )
    ).toBe('expired');
  });

  it('prefers revoked over expired', () => {
    expect(
      computeApiKeyStatus(
        makeKey({
          is_active: false,
          revoked_at: '2026-05-01T00:00:00Z',
          expires_at: '2026-01-01T00:00:00Z',
        }),
        NOW
      )
    ).toBe('revoked');
  });
});
