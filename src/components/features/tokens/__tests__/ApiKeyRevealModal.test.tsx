import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiKeyRevealModal } from '../ApiKeyRevealModal';
import type { CreateApiKeyResponse } from '@/types/api-key.types';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

const createdKey: CreateApiKeyResponse = {
  success: true,
  message: 'Created',
  data: {
    id: 'public123',
    public_id: 'public123',
    name: 'Magic LLM delegation token',
    fingerprint: 'FP1234567890',
    secret_last4: 'abcd',
    project_id: 'target-prj',
    owner_user_id: 'usr-service',
    expires_at: '',
    is_active: true,
    created_at: '2026-01-01',
    api_key: 'sk_public123.secret',
  },
};

describe('ApiKeyRevealModal delegated auth snippets', () => {
  it('renders caller and target service env values for delegated tokens', () => {
    render(
      <ApiKeyRevealModal
        isOpen
        onClose={vi.fn()}
        keyData={createdKey}
        delegatedAuthConfig={{
          ownerUserHash: 'usr-service',
          targetProjectHash: 'target-prj',
          targetProjectName: 'Magic LLM',
          sourceProjectHash: 'source-prj',
          sourceProjectName: 'Magic Worlds',
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Delegation Token Created' })).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('MAGIC_LLM_DELEGATION_API_KEY=sk_public123.secret')
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('DELEGATED_AUTH_TRUSTED_CLIENTS=source-prj:public123')
    ).toBeInTheDocument();
    expect(screen.getByText('Target project: Magic LLM')).toBeInTheDocument();
    expect(screen.getByText('Source project: Magic Worlds')).toBeInTheDocument();
  });
});
