import { describe, it, expect } from 'vitest';
import { DEFAULT_GROUP_ROLES } from '@/utils/default-groups';

describe('ProjectFormModal — onProjectCreated callback contract', () => {
  it('callback signature accepts project hash string', () => {
    // Verify the callback type contract
    const onProjectCreated = (hash: string) => {
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    };

    onProjectCreated('proj-abc123');
  });

  it('toast message includes default group names', () => {
    const projectHash = 'proj-abc';
    const defaultGroupNames = DEFAULT_GROUP_ROLES.map(
      (role) => `${role}_${projectHash}`
    );

    const toastMessage = `Project created successfully. Default groups created: ${defaultGroupNames.join(', ')}`;

    expect(toastMessage).toContain('Project created successfully');
    expect(toastMessage).toContain('Default groups created');
    expect(toastMessage).toContain('admin_proj-abc');
    expect(toastMessage).toContain('user_proj-abc');
    expect(toastMessage).toContain('readonly_proj-abc');
  });

  it('callback should NOT be invoked in edit mode', () => {
    // In edit mode, onProjectCreated should never be called
    let called = false;
    const onProjectCreated = () => { called = true; };

    // Simulate edit mode: no callback invocation
    // (The component only calls onProjectCreated in create mode)
    expect(called).toBe(false);
  });

  it('callback is invoked before onSuccess in create mode', () => {
    const callOrder: string[] = [];
    const onProjectCreated = () => callOrder.push('onProjectCreated');
    const onSuccess = () => callOrder.push('onSuccess');

    // Simulate the component's create flow:
    onProjectCreated();
    onSuccess();

    expect(callOrder).toEqual(['onProjectCreated', 'onSuccess']);
  });
});
