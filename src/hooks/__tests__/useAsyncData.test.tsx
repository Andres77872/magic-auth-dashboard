import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAsyncData } from '../useAsyncData';

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useAsyncData', () => {
  it('loads once and exposes the data', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a']);
    const { result } = renderHook(() => useAsyncData(fetcher));
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual(['a']));
    expect(result.current.isLoading).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('keeps the previous data visible while refreshing', async () => {
    const second = deferred<string[]>();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(['old'])
      .mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useAsyncData(fetcher));
    await waitFor(() => expect(result.current.data).toEqual(['old']));

    let refresh!: Promise<void>;
    act(() => {
      refresh = result.current.refetch();
    });
    expect(result.current.data).toEqual(['old']);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isRefreshing).toBe(true);

    await act(async () => {
      second.resolve(['new']);
      await refresh;
    });
    expect(result.current.data).toEqual(['new']);
    expect(result.current.isRefreshing).toBe(false);
  });

  it('ignores a slow response that a newer request superseded', async () => {
    const slow = deferred<string>();
    const fast = deferred<string>();
    const fetcher = vi
      .fn()
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fast.promise);
    const { result } = renderHook(() =>
      useAsyncData(fetcher, { enabled: false })
    );

    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.refetch();
      second = result.current.refetch();
    });
    await act(async () => {
      fast.resolve('fresh');
      await second;
      slow.resolve('stale');
      await first;
    });
    expect(result.current.data).toBe('fresh');
  });

  it('reports errors and keeps existing data', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce('ok')
      .mockRejectedValueOnce(new Error('Service unavailable'));
    const { result } = renderHook(() => useAsyncData(fetcher));
    await waitFor(() => expect(result.current.data).toBe('ok'));
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.error).toBe('Service unavailable');
    expect(result.current.data).toBe('ok');
  });

  it('does not fetch while disabled', async () => {
    const fetcher = vi.fn().mockResolvedValue(1);
    const { result } = renderHook(() =>
      useAsyncData(fetcher, { enabled: false })
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
});
