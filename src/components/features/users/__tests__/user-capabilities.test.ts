import { describe, expect, it } from 'vitest';
import { UserType } from '@/types/auth.types';
import { getUserCapabilities } from '../user-capabilities';

const root = { userType: UserType.ROOT, userHash: 'usr-root' };
const admin = { userType: UserType.ADMIN, userHash: 'usr-admin' };
const consumerTarget = {
  user_hash: 'usr-c',
  user_type: 'consumer',
  is_active: true,
};
const rootTarget = { user_hash: 'usr-r2', user_type: 'root', is_active: true };

describe('getUserCapabilities', () => {
  it('gives root every action on other accounts', () => {
    expect(getUserCapabilities(root, consumerTarget)).toMatchObject({
      canEdit: true,
      canChangeType: true,
      canResetPassword: true,
      canDeactivate: true,
      canDelete: true,
      canHardDelete: true,
    });
  });

  it('never lets an operator remove or retype themselves', () => {
    const caps = getUserCapabilities(root, {
      user_hash: 'usr-root',
      user_type: 'root',
      is_active: true,
    });
    expect(caps.canDeactivate).toBe(false);
    expect(caps.canDelete).toBe(false);
    expect(caps.canHardDelete).toBe(false);
    expect(caps.canChangeType).toBe(false);
    expect(caps.reason).toMatch(/your own account/);
  });

  it('keeps admins away from root accounts and type changes', () => {
    const caps = getUserCapabilities(admin, rootTarget);
    expect(caps).toMatchObject({
      canEdit: false,
      canDeactivate: false,
      canDelete: false,
      canChangeType: false,
    });
    expect(caps.reason).toMatch(/Only root/);
  });

  it('lets admins manage consumers but not hard-delete or retype them', () => {
    expect(getUserCapabilities(admin, consumerTarget)).toMatchObject({
      canEdit: true,
      canResetPassword: true,
      canDeactivate: true,
      canDelete: true,
      canHardDelete: false,
      canChangeType: false,
    });
  });

  it('offers no password reset for root targets, even to root', () => {
    expect(getUserCapabilities(root, rootTarget).canResetPassword).toBe(false);
  });

  it('allows only permanent deletion of deactivated accounts, by root', () => {
    const inactive = { ...consumerTarget, is_active: false };
    expect(getUserCapabilities(root, inactive)).toMatchObject({
      canEdit: false,
      canDeactivate: false,
      canHardDelete: true,
    });
    expect(getUserCapabilities(admin, inactive).canHardDelete).toBe(false);
  });
});
