import type { CanvasRepository } from '@git-canvas/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as repositoryApi from '../../api/repositoryApi';
import { useRepository } from '../useRepository';

vi.mock('../../api/repositoryApi');

describe('useRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態ではローディング中', () => {
    vi.spyOn(repositoryApi, 'fetchRepository').mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useRepository('Sottiki', 'git-canvas'));

    expect(result.current.loading).toBe(true);
    expect(result.current.repository).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('データ取得に成功すると、repositoryに値が設定される', async () => {
    const mockRepository: CanvasRepository = {
      owner: 'Sottiki',
      name: 'git-canvas',
      commits: [],
      branches: [],
    };

    vi.spyOn(repositoryApi, 'fetchRepository').mockResolvedValueOnce(mockRepository);

    const { result } = renderHook(() => useRepository('Sottiki', 'git-canvas'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.repository).toEqual(mockRepository);
    expect(result.current.error).toBeNull();
  });

  it('データ取得に失敗すると、errorに値が設定される', async () => {
    const mockError = new Error('API Error');
    vi.spyOn(repositoryApi, 'fetchRepository').mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useRepository('Sottiki', 'git-canvas'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.repository).toBeNull();
    expect(result.current.error).toEqual(mockError);
  });

  it('refetchを呼ぶとデータを再取得する', async () => {
    const mockRepository: CanvasRepository = {
      owner: 'Sottiki',
      name: 'git-canvas',
      commits: [],
      branches: [],
    };

    const fetchSpy = vi.spyOn(repositoryApi, 'fetchRepository').mockResolvedValue(mockRepository);

    const { result } = renderHook(() => useRepository('Sottiki', 'git-canvas'));

    // 初回取得完了
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = fetchSpy.mock.calls.length;
    expect(initialCallCount).toBe(1);

    // refetch を実行して、loading が true になるのを待つ
    act(() => {
      result.current.refetch();
    });

    // loading が true になったことを確認
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    // loading が false になる（完了）のを待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 呼び出し回数を確認
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('owner/repoが変わると異なるデータを再取得する', async () => {
    const mockRepository1: CanvasRepository = {
      owner: 'Sottiki',
      name: 'git-canvas',
      commits: [],
      branches: [{ name: 'main', latestCommitId: 'abc', isProtected: false }],
    };

    const mockRepository2: CanvasRepository = {
      owner: 'Sottiki',
      name: 'other-repo',
      commits: [],
      branches: [{ name: 'develop', latestCommitId: 'def', isProtected: true }],
    };

    const fetchSpy = vi
      .spyOn(repositoryApi, 'fetchRepository')
      .mockResolvedValueOnce(mockRepository1)
      .mockResolvedValueOnce(mockRepository2);

    const { result, rerender } = renderHook(({ owner, repo }) => useRepository(owner, repo), {
      initialProps: { owner: 'Sottiki', repo: 'git-canvas' },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.current.repository).toEqual(mockRepository1);

    // rerender を act で包む
    act(() => {
      rerender({ owner: 'Sottiki', repo: 'other-repo' });
    });

    // 呼び出し回数が増えるのを待つ
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    expect(result.current.repository).toEqual(mockRepository2);
    expect(result.current.repository?.name).toBe('other-repo');
    expect(result.current.repository?.branches[0].name).toBe('develop');
  });
});
