import type { GitHubBranch, GitHubCommit } from '@git-canvas/shared/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GitHubClient } from '../../services/githubClient';

// fetch のモック
global.fetch = vi.fn();

describe('GitHubClient', () => {
  let client: GitHubClient;

  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks();
    client = new GitHubClient('test-token');
  });

  describe('fetchCommits', () => {
    it('リポジトリのコミット一覧を取得できる', async () => {
      // Arrange: モックレスポンス
      const mockCommits: GitHubCommit[] = [
        {
          sha: 'abc123',
          commit: {
            author: {
              name: 'Test User',
              email: 'test@example.com',
              date: '2025-01-01T12:00:00Z',
            },
            committer: {
              name: 'Test User',
              email: 'test@example.com',
              date: '2025-01-01T12:00:00Z',
            },
            message: 'Test commit',
            tree: { sha: 'tree123' },
            comment_count: 0,
          },
          author: null,
          committer: null,
          parents: [],
          html_url: 'https://github.com/owner/repo/commit/abc123',
        },
      ];

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits,
      });

      // Act
      const result = await client.fetchCommits('owner', 'repo');

      // Assert
      expect(result).toEqual(mockCommits);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/commits?per_page=100&page=1',
        {
          headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            Authorization: 'Bearer test-token',
          },
        }
      );
    });

    it('ページネーションオプションを正しく処理する', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await client.fetchCommits('owner', 'repo', { per_page: 50, page: 2 });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/commits?per_page=50&page=2',
        expect.any(Object)
      );
    });

    it('トークンなしでもリクエストできる', async () => {
      const clientWithoutToken = new GitHubClient();

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await clientWithoutToken.fetchCommits('owner', 'repo');

      expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          // Authorization ヘッダーが含まれていないことを確認
        },
      });
    });

    it('APIエラー時に適切な例外をスローする', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Repository not found',
      });

      await expect(client.fetchCommits('owner', 'repo')).rejects.toThrow(
        'GitHub API request failed: 404 Not Found'
      );
    });
  });

  describe('fetchBranches', () => {
    it('リポジトリのブランチ一覧を取得できる', async () => {
      const mockBranches: GitHubBranch[] = [
        {
          name: 'main',
          commit: {
            sha: 'abc123',
            url: 'https://api.github.com/repos/owner/repo/commits/abc123',
          },
          protected: true,
        },
        {
          name: 'develop',
          commit: {
            sha: 'def456',
            url: 'https://api.github.com/repos/owner/repo/commits/def456',
          },
          protected: false,
        },
      ];

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBranches,
      });

      const result = await client.fetchBranches('owner', 'repo');

      expect(result).toEqual(mockBranches);
      expect(fetch).toHaveBeenCalledWith('https://api.github.com/repos/owner/repo/branches', {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          Authorization: 'Bearer test-token',
        },
      });
    });

    it('APIエラー時に適切な例外をスローする', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Rate limit exceeded',
      });

      await expect(client.fetchBranches('owner', 'repo')).rejects.toThrow(
        'GitHub API request failed: 403 Forbidden'
      );
    });
  });
});
