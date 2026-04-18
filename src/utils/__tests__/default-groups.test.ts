import { describe, it, expect } from 'vitest';
import {
  isDefaultUserGroup,
  getDefaultGroupRole,
  getDefaultGroupsForProject,
  DEFAULT_GROUP_ROLES,
} from '../default-groups';

describe('isDefaultUserGroup', () => {
  it('returns true for admin_{id} pattern', () => {
    expect(isDefaultUserGroup('admin_123')).toBe(true);
  });

  it('returns true for user_{id} pattern', () => {
    expect(isDefaultUserGroup('user_456')).toBe(true);
  });

  it('returns true for readonly_{id} pattern', () => {
    expect(isDefaultUserGroup('readonly_789')).toBe(true);
  });

  it('returns false for custom group names', () => {
    expect(isDefaultUserGroup('custom-group')).toBe(false);
  });

  it('returns false for admin_ with no id (loose pattern requires .+)', () => {
    expect(isDefaultUserGroup('admin_')).toBe(false);
  });

  it('is case-sensitive: Admin_123 should be false', () => {
    expect(isDefaultUserGroup('Admin_123')).toBe(false);
  });

  it('returns true for admin_abc_extra (loose pattern)', () => {
    expect(isDefaultUserGroup('admin_abc_extra')).toBe(true);
  });

  it('with projectId: matches exact project ID', () => {
    expect(isDefaultUserGroup('admin_123', '123')).toBe(true);
    expect(isDefaultUserGroup('admin_456', '123')).toBe(false);
  });

  it('with projectId: rejects partial matches', () => {
    expect(isDefaultUserGroup('admin_1234', '123')).toBe(false);
    expect(isDefaultUserGroup('admin_12', '123')).toBe(false);
  });
});

describe('getDefaultGroupRole', () => {
  it('returns "admin" for admin_{id}', () => {
    expect(getDefaultGroupRole('admin_123')).toBe('admin');
  });

  it('returns "user" for user_{id}', () => {
    expect(getDefaultGroupRole('user_456')).toBe('user');
  });

  it('returns "readonly" for readonly_{id}', () => {
    expect(getDefaultGroupRole('readonly_789')).toBe('readonly');
  });

  it('returns null for non-default groups', () => {
    expect(getDefaultGroupRole('custom-group')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getDefaultGroupRole('')).toBeNull();
  });
});

describe('getDefaultGroupsForProject', () => {
  it('returns 3 groups for a project', () => {
    const groups = getDefaultGroupsForProject('proj-123');
    expect(groups).toHaveLength(3);
  });

  it('returns correct group names', () => {
    const groups = getDefaultGroupsForProject('proj-123');
    expect(groups.map((g) => g.name)).toEqual([
      'admin_proj-123',
      'user_proj-123',
      'readonly_proj-123',
    ]);
  });

  it('returns correct roles', () => {
    const groups = getDefaultGroupsForProject('proj-123');
    expect(groups.map((g) => g.role)).toEqual(['admin', 'user', 'readonly']);
  });

  it('returns correct descriptions', () => {
    const groups = getDefaultGroupsForProject('proj-123');
    expect(groups[0].description).toBe('Project administrators');
    expect(groups[1].description).toBe('Regular users');
    expect(groups[2].description).toBe('Read-only users');
  });
});

describe('DEFAULT_GROUP_ROLES', () => {
  it('contains exactly 3 roles', () => {
    expect(DEFAULT_GROUP_ROLES).toHaveLength(3);
  });

  it('contains admin, user, readonly', () => {
    expect(DEFAULT_GROUP_ROLES).toContain('admin');
    expect(DEFAULT_GROUP_ROLES).toContain('user');
    expect(DEFAULT_GROUP_ROLES).toContain('readonly');
  });
});
