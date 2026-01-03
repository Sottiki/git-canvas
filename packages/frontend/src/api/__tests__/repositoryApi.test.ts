import type { CanvasBranch, CanvasCommit, CanvasRepository } from '@git-canvas/shared/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchBranches, fetchCommits, fetchRepository } from '../repositoryApi';

global.fetch = vi.fn();

describe('repositoryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchCommits', () => {
    it('コミット一覧を正常に取得できる', async () => {
      const mockCommits: CanvasCommit[] = [
        {
          id: 'abc123',
          shortId: 'abc123d',
          message: 'Test commit',
          fullMessage: 'Test commit',
          date: '2025-01-01T12:00:00Z',
          author: {
            name: 'Test User',
            email: 'test@example.com',
          },
          parentIds: [],
          branchNames: [],
          url: 'https://github.com/owner/repo/commit/abc123',
        },
      ];

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits,
      } as Response);

      const result = await fetchCommits('Sottiki', 'git-canvas');

      expect(result).toEqual(mockCommits);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/repositories/Sottiki/git-canvas/commits'
      );
    });

    it('ページネーションパラメータを正しく付与する', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await fetchCommits('Sottiki', 'git-canvas', { per_page: 50, page: 2 });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/repositories/Sottiki/git-canvas/commits?per_page=50&page=2'
      );
    });

    it('エラー時に例外をスローする', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      await expect(fetchCommits('Sottiki', 'git-canvas')).rejects.toThrow(
        'Failed to fetch commits: Not Found'
      );
    });
  });

  describe('fetchBranches', () => {
    it('ブランチ一覧を正常に取得できる', async () => {
      const mockBranches: CanvasBranch[] = [
        {
          name: 'main',
          latestCommitId: 'abc123',
          isProtected: false,
        },
      ];

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBranches,
      } as Response);

      const result = await fetchBranches('Sottiki', 'git-canvas');

      expect(result).toEqual(mockBranches);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/repositories/Sottiki/git-canvas/branches'
      );
    });

    it('エラー時に例外をスローする', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(fetchBranches('Sottiki', 'git-canvas')).rejects.toThrow(
        'Failed to fetch branches: Internal Server Error'
      );
    });
  });

  describe('fetchRepository', () => {
    it('リポジトリ全体の情報を正常に取得できる', async () => {
      const mockRepository: CanvasRepository = {
        owner: 'Sottiki',
        name: 'git-canvas',
        commits: [],
        branches: [],
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRepository,
      } as Response);

      const result = await fetchRepository('Sottiki', 'git-canvas');

      expect(result).toEqual(mockRepository);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/repositories/Sottiki/git-canvas'
      );
    });

    it('エラー時に例外をスローする', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Service Unavailable',
      } as Response);

      await expect(fetchRepository('Sottiki', 'git-canvas')).rejects.toThrow(
        'Failed to fetch repository: Service Unavailable'
      );
    });
  });
});
