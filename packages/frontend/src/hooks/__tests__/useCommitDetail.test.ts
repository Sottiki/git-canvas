import type { CommitDetail } from '@git-canvas/shared/types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useCommitDetail } from '../useCommitDetail';

describe('useCommitDetail', () => {
  const mockCommitDetail: CommitDetail = {
    sha: 'abc123def456',
    files: [
      {
        filename: 'src/index.ts',
        status: 'modified',
        additions: 10,
        deletions: 5,
        changes: 15,
      },
      {
        filename: 'README.md',
        status: 'added',
        additions: 20,
        deletions: 0,
        changes: 20,
      },
    ],
    stats: {
      total: 35,
      additions: 30,
      deletions: 5,
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初期状態はローディング中である', () => {
    // Arrange
    vi.spyOn(global, 'fetch').mockImplementation(
      () => new Promise(() => {}) // 永遠に解決しないPromise
    );

    // Act
    const { result } = renderHook(() => useCommitDetail('owner', 'repo', 'sha123'));

    // Assert
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('正常にデータを取得できる', async () => {
    // Arrange
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCommitDetail),
    } as Response);

    // Act
    const { result } = renderHook(() => useCommitDetail('owner', 'repo', 'abc123def456'));

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockCommitDetail);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      '/api/repositories/owner/repo/commits/abc123def456',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('APIエラー時にエラー状態になる', async () => {
    // Arrange
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    // Act
    const { result } = renderHook(() => useCommitDetail('owner', 'repo', 'notfound'));

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('404');
  });

  it('ネットワークエラー時にエラー状態になる', async () => {
    // Arrange
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    // Act
    const { result } = renderHook(() => useCommitDetail('owner', 'repo', 'sha123'));

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });

  it('パラメータが変更されると再取得する', async () => {
    // Arrange
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCommitDetail),
    } as Response);

    // Act
    const { result, rerender } = renderHook(
      ({ owner, repo, sha }) => useCommitDetail(owner, repo, sha),
      { initialProps: { owner: 'owner1', repo: 'repo1', sha: 'sha1' } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // パラメータを変更
    rerender({ owner: 'owner2', repo: 'repo2', sha: 'sha2' });

    // Assert
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    expect(fetchSpy).toHaveBeenLastCalledWith(
      '/api/repositories/owner2/repo2/commits/sha2',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('ownerが空の場合はAPIを呼び出さない', async () => {
    // Arrange
    const fetchSpy = vi.spyOn(global, 'fetch');

    // Act
    const { result } = renderHook(() => useCommitDetail('', 'repo', 'sha'));

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it('repoが空の場合はAPIを呼び出さない', async () => {
    // Arrange
    const fetchSpy = vi.spyOn(global, 'fetch');

    // Act
    const { result } = renderHook(() => useCommitDetail('owner', '', 'sha'));

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shaが空の場合はAPIを呼び出さない', async () => {
    // Arrange
    const fetchSpy = vi.spyOn(global, 'fetch');

    // Act
    const { result } = renderHook(() => useCommitDetail('owner', 'repo', ''));

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('特殊文字を含むパラメータがエンコードされる', async () => {
    // Arrange
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCommitDetail),
    } as Response);

    // Act
    const { result } = renderHook(() => useCommitDetail('owner/special', 'repo name', 'sha#123'));

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/repositories/owner%2Fspecial/repo%20name/commits/sha%23123',
      expect.any(Object)
    );
  });
});
