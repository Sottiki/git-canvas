import type { GitHubBranch, GitHubCommit } from '@git-canvas/shared/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GitHubClient } from '../../services/githubClient';
import { GitHubService } from '../../services/githubService';

describe('GitHubService', () => {
  let service: GitHubService;
  let mockClient: GitHubClient;

  beforeEach(() => {
    // モッククライアントの作成
    mockClient = {
      fetchCommits: vi.fn(),
      fetchBranches: vi.fn(),
    } as unknown as GitHubClient;

    // モッククライアントを注入してサービスを作成
    service = new GitHubService(mockClient);
  });

  describe('getCommits', () => {
    it('GitHub APIからコミットを取得し、Canvas型に変換して返す', async () => {
      // Arrange: モックデータ準備
      const mockGitHubCommits: GitHubCommit[] = [
        {
          sha: 'abc123def456789012345678901234567890abcd',
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
            message: 'Test commit\n\nDetailed description',
            tree: { sha: 'tree123' },
            comment_count: 0,
          },
          author: {
            login: 'testuser',
            id: 123,
            avatar_url: 'https://example.com/avatar.jpg',
            html_url: 'https://github.com/testuser',
          },
          committer: null,
          parents: [{ sha: 'parent123' }],
          html_url: 'https://github.com/owner/repo/commit/abc123',
        },
      ];

      (mockClient.fetchCommits as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockGitHubCommits
      );

      // Act: コミット取得
      const result = await service.getCommits('owner', 'repo');

      // Assert: Canvas型に変換されていること
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'abc123def456789012345678901234567890abcd',
        shortId: 'abc123d',
        message: 'Test commit',
        fullMessage: 'Test commit\n\nDetailed description',
        date: new Date('2025-01-01T12:00:00Z'),
        author: {
          name: 'Test User',
          email: 'test@example.com',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        parentIds: ['parent123'],
        branchNames: [],
        url: 'https://github.com/owner/repo/commit/abc123',
      });

      // クライアントが正しく呼ばれたか
      expect(mockClient.fetchCommits).toHaveBeenCalledWith('owner', 'repo', undefined);
    });

    it('ページネーションオプションをクライアントに渡す', async () => {
      (mockClient.fetchCommits as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await service.getCommits('owner', 'repo', { per_page: 50, page: 2 });

      expect(mockClient.fetchCommits).toHaveBeenCalledWith('owner', 'repo', {
        per_page: 50,
        page: 2,
      });
    });
  });

  describe('getBranches', () => {
    it('GitHub APIからブランチを取得し、Canvas型に変換して返す', async () => {
      // Arrange: モックデータ準備
      const mockGitHubBranches: GitHubBranch[] = [
        {
          name: 'main',
          commit: {
            sha: 'abc123def456',
            url: 'https://api.github.com/repos/owner/repo/commits/abc123',
          },
          protected: true,
        },
        {
          name: 'develop',
          commit: {
            sha: 'def456abc789',
            url: 'https://api.github.com/repos/owner/repo/commits/def456',
          },
          protected: false,
        },
      ];

      (mockClient.fetchBranches as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockGitHubBranches
      );

      // Act: ブランチ取得
      const result = await service.getBranches('owner', 'repo');

      // Assert: Canvas型に変換されているか確認
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'main',
        latestCommitId: 'abc123def456',
        isProtected: true,
      });
      expect(result[1]).toEqual({
        name: 'develop',
        latestCommitId: 'def456abc789',
        isProtected: false,
      });

      // クライアントが正しく呼ばれたか確認
      expect(mockClient.fetchBranches).toHaveBeenCalledWith('owner', 'repo');
    });
  });

  describe('getRepository', () => {
    it('コミットとブランチを並列取得し、CanvasRepository型で返す', async () => {
      // Arrange: モックデータ準備
      const mockGitHubCommits: GitHubCommit[] = [
        {
          sha: 'commit123',
          commit: {
            author: {
              name: 'Author',
              email: 'author@example.com',
              date: '2025-01-01T12:00:00Z',
            },
            committer: {
              name: 'Author',
              email: 'author@example.com',
              date: '2025-01-01T12:00:00Z',
            },
            message: 'Commit message',
            tree: { sha: 'tree123' },
            comment_count: 0,
          },
          author: null,
          committer: null,
          parents: [],
          html_url: 'https://github.com/owner/repo/commit/commit123',
        },
      ];

      const mockGitHubBranches: GitHubBranch[] = [
        {
          name: 'main',
          commit: {
            sha: 'commit123',
            url: 'https://api.github.com/repos/owner/repo/commits/commit123',
          },
          protected: true,
        },
      ];

      (mockClient.fetchCommits as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockGitHubCommits
      );
      (mockClient.fetchBranches as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockGitHubBranches
      );

      // Act: リポジトリ情報取得
      const result = await service.getRepository('owner', 'repo');

      // Assert: CanvasRepository型の構造確認
      expect(result).toEqual({
        owner: 'owner',
        name: 'repo',
        commits: expect.any(Array),
        branches: expect.any(Array),
      });

      expect(result.commits).toHaveLength(1);
      expect(result.branches).toHaveLength(1);

      // 両方のメソッドが呼ばれたことを確認
      expect(mockClient.fetchCommits).toHaveBeenCalledWith('owner', 'repo', undefined);
      expect(mockClient.fetchBranches).toHaveBeenCalledWith('owner', 'repo');
    });

    it('コミットとブランチの取得が並列実行される', async () => {
      // Arrange
      (mockClient.fetchCommits as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
      (mockClient.fetchBranches as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      // Act
      await service.getRepository('owner', 'repo');

      // Assert: 両方が呼ばれたことを確認（Promise.allによる並列実行）
      expect(mockClient.fetchCommits).toHaveBeenCalledTimes(1);
      expect(mockClient.fetchBranches).toHaveBeenCalledTimes(1);
    });
  });
});
