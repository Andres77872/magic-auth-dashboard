import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiKeyService } from '../api-key.service';

const mockedClient = vi.hoisted(() => ({
  get: vi.fn(),
  postForm: vi.fn(),
  putForm: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../api.client', () => ({ apiClient: mockedClient }));

const rawKey = {
  id: 'pub123',
  public_id: 'pub123',
  name: 'Worker',
  description: null,
  project_id: 'proj-internal',
  owner_user_id: 'usr-internal',
  is_active: true,
  expires_at: '2027-01-01T00:00:00',
  last_used_at: null,
  created_at: '2026-01-01T10:30:00',
  updated_at: null,
  revoked_at: null,
  revoke_reason: null,
  fingerprint: 'FP1234567890',
  secret_last4: 'abcd',
  hash_algorithm: 'hmac-sha256-v1',
  project_name: 'Alpha',
  project_hash: 'proj-hash',
};

describe('apiKeyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists keys with owner and project filters together and unwraps data', async () => {
    mockedClient.get.mockResolvedValue({
      success: true,
      message: 'ok',
      data: { keys: [rawKey], total: 1, limit: 25, offset: 0 },
    });

    const page = await apiKeyService.listKeys({
      userHash: 'usr-hash',
      projectHash: 'proj-hash',
      activeOnly: false,
      limit: 25,
      offset: 0,
    });

    expect(mockedClient.get).toHaveBeenCalledWith('/api-keys', {
      user_hash: 'usr-hash',
      project_hash: 'proj-hash',
      limit: 25,
      offset: 0,
    });
    expect(page.total).toBe(1);
    // Naive backend timestamps are read as UTC.
    expect(page.keys[0].created_at).toBe('2026-01-01T10:30:00Z');
    expect(page.keys[0].expires_at).toBe('2027-01-01T00:00:00Z');
  });

  it('sends active_only only when requested', async () => {
    mockedClient.get.mockResolvedValue({
      success: true,
      message: 'ok',
      data: { keys: [], total: 0, limit: 25, offset: 0 },
    });

    await apiKeyService.listKeys({
      projectHash: 'proj-hash',
      activeOnly: true,
    });

    expect(mockedClient.get.mock.calls[0][1]).toMatchObject({
      project_hash: 'proj-hash',
      active_only: 'true',
    });
  });

  it('rejects a list response without data instead of defaulting to empty', async () => {
    mockedClient.get.mockResolvedValue({ success: false, message: 'nope' });

    await expect(
      apiKeyService.listKeys({ projectHash: 'proj-hash' })
    ).rejects.toThrow(/did not include any data/);
  });

  it('creates keys with form fields and returns the one-time token', async () => {
    mockedClient.postForm.mockResolvedValue({
      success: true,
      message: 'ok',
      data: { ...rawKey, api_key: 'sk_pub123.secret' },
    });

    const created = await apiKeyService.createKey({
      user_hash: 'usr-hash',
      project_hash: 'proj-hash',
      name: 'Worker',
    });

    expect(mockedClient.postForm).toHaveBeenCalledWith('/api-keys', {
      user_hash: 'usr-hash',
      project_hash: 'proj-hash',
      name: 'Worker',
    });
    expect(created.api_key).toBe('sk_pub123.secret');
  });

  it('encodes the key id in update and revoke paths', async () => {
    mockedClient.putForm.mockResolvedValue({
      success: true,
      message: 'ok',
      data: rawKey,
    });
    mockedClient.delete.mockResolvedValue({
      success: true,
      message: 'ok',
      data: { key_id: 'a/b', revoked_at: '2026-01-02T00:00:00Z' },
    });

    await apiKeyService.updateKey('a/b', { name: 'Renamed' });
    const revoked = await apiKeyService.revokeKey('a/b');

    expect(mockedClient.putForm).toHaveBeenCalledWith('/api-keys/a%2Fb', {
      name: 'Renamed',
    });
    expect(mockedClient.delete).toHaveBeenCalledWith('/api-keys/a%2Fb');
    expect(revoked.key_id).toBe('a/b');
  });
});
