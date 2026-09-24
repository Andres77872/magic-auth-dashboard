import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ProjectFormModal } from '../ProjectFormModal';

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
vi.mock('@/hooks/useProjects', () => ({
  useProjectMutations: () => ({
    pending: null,
    createProject: mocks.createProject,
    updateProject: mocks.updateProject,
    deleteProject: mocks.deleteProject,
  }),
}));

const created = {
  project_hash: 'proj-new',
  project_name: 'CRM',
  project_description: 'Sales',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProjectFormModal (create)', () => {
  it('explains the default groups the API creates with a project', () => {
    render(
      <ProjectFormModal
        open
        onOpenChange={vi.fn()}
        mode="create"
        onSaved={vi.fn()}
      />
    );

    expect(
      screen.getByText(/also creates a project group/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('admin_…', { selector: 'span' }).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText('readonly_…', { selector: 'span' })
    ).toBeInTheDocument();
  });

  it('validates the name before calling the API', async () => {
    render(
      <ProjectFormModal
        open
        onOpenChange={vi.fn()}
        mode="create"
        onSaved={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create project' }));

    expect(
      await screen.findByText('Enter a project name.')
    ).toBeInTheDocument();
    expect(mocks.createProject).not.toHaveBeenCalled();
  });

  it('creates with trimmed values, reports success and closes', async () => {
    mocks.createProject.mockResolvedValue(created);
    const onSaved = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ProjectFormModal
        open
        onOpenChange={onOpenChange}
        mode="create"
        onSaved={onSaved}
      />
    );

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: '  CRM  ' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: ' Sales ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(created));
    expect(mocks.createProject).toHaveBeenCalledWith({
      project_name: 'CRM',
      project_description: 'Sales',
    });
    expect(mocks.showToast).toHaveBeenCalledWith(
      expect.stringContaining('created'),
      'success'
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps the dialog open and shows the API error when creation fails', async () => {
    mocks.createProject.mockRejectedValue(
      new Error('Root user access required to create projects')
    );
    const onOpenChange = vi.fn();
    const onSaved = vi.fn();
    render(
      <ProjectFormModal
        open
        onOpenChange={onOpenChange}
        mode="create"
        onSaved={onSaved}
      />
    );

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'CRM' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }));

    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledWith(
        'Root user access required to create projects',
        'error'
      )
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe('ProjectFormModal (edit)', () => {
  const project = {
    project_hash: 'proj-1',
    project_name: 'CRM',
    project_description: 'Sales',
  };

  it('keeps Save disabled until something changes', () => {
    render(
      <ProjectFormModal
        open
        onOpenChange={vi.fn()}
        mode="edit"
        project={project}
        onSaved={vi.fn()}
      />
    );

    const save = screen.getByRole('button', { name: 'Save changes' });
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'CRM v2' },
    });
    expect(save).toBeEnabled();
  });

  it('explains that clearing the description keeps it, and does not count it as a change', () => {
    render(
      <ProjectFormModal
        open
        onOpenChange={vi.fn()}
        mode="edit"
        project={project}
        onSaved={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: '' },
    });

    expect(screen.getByText(/cannot clear descriptions/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('updates the project through the API', async () => {
    mocks.updateProject.mockResolvedValue({
      ...created,
      project_hash: 'proj-1',
      project_name: 'CRM v2',
    });
    const onSaved = vi.fn();
    render(
      <ProjectFormModal
        open
        onOpenChange={vi.fn()}
        mode="edit"
        project={project}
        onSaved={onSaved}
      />
    );

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'CRM v2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mocks.updateProject).toHaveBeenCalledWith('proj-1', {
      project_name: 'CRM v2',
      project_description: 'Sales',
    });
  });
});
