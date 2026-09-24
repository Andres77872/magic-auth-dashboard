import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePatreonPagedList } from '../usePatreonPagedList';

interface Filters {
  limit: number;
  offset: number;
  status: string;
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('usePatreonPagedList', () => {
  it('keeps the latest request when an older one resolves last', async () => {
    const calls: Array<{
      filters: Filters;
      done: ReturnType<typeof deferred<{ items: string[]; pagination: never }>>;
    }> = [];
    const load = (
      filters: Filters
    ): Promise<{ items: string[]; pagination: never }> => {
      const done = deferred<{ items: string[]; pagination: never }>();
      calls.push({ filters, done });
      return done.promise;
    };

    const { result } = renderHook(() =>
      usePatreonPagedList(load, { limit: 20, offset: 0, status: '' }, 'failed')
    );
    await waitFor(() => expect(calls).toHaveLength(1));

    act(() => result.current.setFilters({ status: 'failed' }));
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1].filters.status).toBe('failed');

    await act(async () => {
      calls[1].done.resolve({ items: ['newest'], pagination: {} as never });
      calls[0].done.resolve({ items: ['stale'], pagination: {} as never });
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual(['newest']);
    expect(result.current.filters.status).toBe('failed');
  });
});
