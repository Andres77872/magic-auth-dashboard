import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatCount,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  truncateHash,
} from '../formatters';
import {
  getActivityCategory,
  getActivityLabel,
  getActivitySummary,
  getActivityTone,
} from '../activity';

describe('formatters', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-24T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders placeholders instead of "Invalid Date"', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
    expect(formatDateTime('', 'Never')).toBe('Never');
    expect(formatRelativeTime('not a date')).toBe('—');
  });

  it('uses compact relative times for recent events', () => {
    expect(formatRelativeTime('2026-09-24T11:59:50Z')).toBe('just now');
    expect(formatRelativeTime('2026-09-24T11:55:00Z')).toBe('5m ago');
    expect(formatRelativeTime('2026-09-24T09:00:00Z')).toBe('3h ago');
    expect(formatRelativeTime('2026-09-20T12:00:00Z')).toBe('4d ago');
  });

  it('switches to an absolute date for older or future timestamps', () => {
    expect(formatRelativeTime('2026-03-01T12:00:00Z')).toBe('Mar 1');
    expect(formatRelativeTime('2025-03-01T12:00:00Z')).toBe('Mar 1, 2025');
    expect(formatRelativeTime('2026-10-10T12:00:00Z')).toBe('Oct 10, 2026');
  });

  it('formats numbers, percentages and counts', () => {
    expect(formatNumber(12480)).toBe('12,480');
    expect(formatNumber(undefined)).toBe('—');
    expect(formatPercent(97.654)).toBe('97.7%');
    expect(formatCount(1, 'member')).toBe('1 member');
    expect(formatCount(3, 'member')).toBe('3 members');
  });

  it('truncates long ids in the middle', () => {
    expect(
      truncateHash('usr-0123456789abcdef', { startChars: 6, endChars: 4 })
    ).toBe('usr-01...cdef');
    expect(truncateHash('short')).toBe('short');
  });
});

describe('activity helpers', () => {
  it('labels known activity types and humanises unknown ones', () => {
    expect(getActivityLabel('user_login')).toBe('Signed in');
    expect(getActivityLabel('brand_new_event')).toBe('Brand new event');
  });

  it('groups activity types by area', () => {
    expect(getActivityCategory('user_login')).toBe('auth');
    expect(getActivityCategory('google_oauth_login_denied')).toBe('oauth');
    expect(getActivityCategory('stripe_webhook_rejected')).toBe('billing');
    expect(getActivityCategory('user_group_assign')).toBe('group');
    expect(getActivityCategory('permission_grant')).toBe('access');
  });

  it('flags failures and destructive changes', () => {
    expect(getActivityTone('google_oauth_login_denied')).toBe('warning');
    expect(getActivityTone('project_delete')).toBe('destructive');
    expect(getActivityTone('patreon_sync_completed')).toBe('success');
    expect(getActivityTone('user_update')).toBe('default');
  });

  it('summarises string, JSON-string and object details', () => {
    expect(getActivitySummary('Updated email')).toBe('Updated email');
    expect(getActivitySummary('{"message":"Role changed"}')).toBe(
      'Role changed'
    );
    expect(getActivitySummary({ action: 'bulk update' })).toBe('bulk update');
    expect(getActivitySummary(null)).toBeNull();
    expect(getActivitySummary(['x'])).toBeNull();
  });
});
