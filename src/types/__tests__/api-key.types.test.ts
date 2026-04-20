import { describe, it, expect } from 'vitest';
import { computeApiKeyStatus } from '../api-key.types';
import type { ApiKey, CreateApiKeyRequest } from '../api-key.types';

const createMockKey = (overrides: Partial<ApiKey> = {}): ApiKey => ({
  id: 'key-1',
  public_id: 'pub-abc123',
  name: 'Test Key',
  fingerprint: 'ABC123DEF456',
  secret_last4: 'xyz0',
  project_id: 'proj-1',
  owner_user_id: 'user-1',
  expires_at: '2026-12-31',
  is_active: true,
  created_at: '2025-01-01',
  ...overrides,
});

describe('CreateApiKeyRequest type', () => {
  it('requires user_hash for admin-managed token creation', () => {
    const request: CreateApiKeyRequest = {
      user_hash: 'usr_consumer1',
      project_hash: 'prj_abc',
      name: 'CI Token',
    };
    expect(request.user_hash).toBe('usr_consumer1');
    expect(request.project_hash).toBe('prj_abc');
  });
});

describe('computeApiKeyStatus', () => {
  it('returns "active" for active key with future expiry', () => {
    const key = createMockKey({
      is_active: true,
      expires_at: '2027-12-31',
    });
    
    expect(computeApiKeyStatus(key)).toBe('active');
  });

  it('returns "active" for active key with no expiry', () => {
    const key = createMockKey({
      is_active: true,
      expires_at: '',
    });
    
    expect(computeApiKeyStatus(key)).toBe('active');
  });

  it('returns "expired" for active key with past expiry', () => {
    const key = createMockKey({
      is_active: true,
      expires_at: '2024-01-01',
    });
    
    expect(computeApiKeyStatus(key)).toBe('expired');
  });

  it('returns "revoked" for inactive key with revoked_at', () => {
    const key = createMockKey({
      is_active: false,
      revoked_at: '2025-06-01',
    });
    
    expect(computeApiKeyStatus(key)).toBe('revoked');
  });

  it('returns "revoked" for inactive key without revoked_at', () => {
    const key = createMockKey({
      is_active: false,
      revoked_at: undefined,
    });
    
    expect(computeApiKeyStatus(key)).toBe('revoked');
  });

  it('prioritizes revoked status over expired', () => {
    const key = createMockKey({
      is_active: false,
      revoked_at: '2025-06-01',
      expires_at: '2024-01-01',
    });
    
    expect(computeApiKeyStatus(key)).toBe('revoked');
  });
});