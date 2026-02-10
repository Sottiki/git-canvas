import type { GitHubBranch, GitHubCommit, GitHubCommitWithFiles } from '@git-canvas/shared/types';
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
      fetchCommitDetail: vi.fn(),
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

      const mockGitHubBranches: GitHubBranch[] = [
        {
          name: 'main',
          commit: {
            sha: 'abc123def456789012345678901234567890abcd',
            url: 'https://api.github.com/repos/owner/repo/commits/abc123',
          },
          protected: false,
        },
      ];

      // getCommitsは内部でgetBranchesを呼ぶため、両方をモック
      (mockClient.fetchBranches as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockGitHubBranches
      );
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
        date: '2025-01-01T12:00:00Z',
        author: {
          name: 'Test User',
          email: 'test@example.com',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        parentIds: ['parent123'],
        branchNames: ['main'], // ブランチ情報が含まれる
        url: 'https://github.com/owner/repo/commit/abc123',
      });

      // getBranchesも呼ばれることを確認
      expect(mockClient.fetchBranches).toHaveBeenCalledWith('owner', 'repo');
      expect(mockClient.fetchCommits).toHaveBeenCalledWith('owner', 'repo', {
        sha: 'main',
      });
    });

    it('ページネーションオプションをクライアントに渡す', async () => {
      const mockGitHubBranches: GitHubBranch[] = [
        {
          name: 'main',
          commit: { sha: 'abc123', url: 'https://...' },
          protected: false,
        },
      ];

      (mockClient.fetchBranches as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockGitHubBranches
      );
      (mockClient.fetchCommits as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await service.getCommits('owner', 'repo', { per_page: 50, page: 2 });

      // ブランチごとにfetchCommitsが呼ばれる
      expect(mockClient.fetchCommits).toHaveBeenCalledWith('owner', 'repo', {
        per_page: 50,
        page: 2,
        sha: 'main',
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

      // getCommitsが内部でgetBranchesを呼ぶため、2回モック
      (mockClient.fetchBranches as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockGitHubBranches) // getCommits内部で使用
        .mockResolvedValueOnce(mockGitHubBranches); // getRepository内部で使用
      (mockClient.fetchCommits as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockGitHubCommits
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

      // fetchBranchesが2回呼ばれる（getCommits内とgetBranches内）
      expect(mockClient.fetchBranches).toHaveBeenCalledTimes(2);
      expect(mockClient.fetchCommits).toHaveBeenCalledTimes(1);
    });

    it('コミットとブランチの取得が並列実行される', async () => {
      // Arrange
      const mockBranches: GitHubBranch[] = [
        { name: 'main', commit: { sha: 'abc', url: '...' }, protected: false },
      ];

      (mockClient.fetchBranches as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockBranches) // getCommits内
        .mockResolvedValueOnce(mockBranches); // getBranches内
      (mockClient.fetchCommits as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      // Act
      await service.getRepository('owner', 'repo');

      // Assert: 両方が呼ばれたことを確認
      expect(mockClient.fetchCommits).toHaveBeenCalledTimes(1);
      expect(mockClient.fetchBranches).toHaveBeenCalledTimes(2); // 2回呼ばれる
    });
  });

  describe('getCommitDetail', () => {
    it('GitHub APIからコミット詳細を取得し、CommitDetail型に変換して返す', async () => {
      // Arrange: モックデータ準備
      const mockGitHubCommitWithFiles: GitHubCommitWithFiles = {
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
          message: 'Test commit',
          tree: { sha: 'tree123' },
          comment_count: 0,
        },
        author: null,
        committer: null,
        parents: [],
        html_url: 'https://github.com/owner/repo/commit/abc123',
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

      (mockClient.fetchCommitDetail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockGitHubCommitWithFiles
      );

      // Act: コミット詳細取得
      const result = await service.getCommitDetail('owner', 'repo', 'abc123def456');

      // Assert: CommitDetail型に変換されていること
      expect(result).toEqual({
        sha: 'abc123def456789012345678901234567890abcd',
        files: [
          {
            filename: 'src/index.ts',
            status: 'modified',
            additions: 10,
            deletions: 5,
            changes: 15,
            previousFilename: undefined,
          },
          {
            filename: 'README.md',
            status: 'added',
            additions: 20,
            deletions: 0,
            changes: 20,
            previousFilename: undefined,
          },
        ],
        stats: {
          total: 35,
          additions: 30,
          deletions: 5,
        },
      });

      // クライアントが正しく呼ばれたか確認
      expect(mockClient.fetchCommitDetail).toHaveBeenCalledWith('owner', 'repo', 'abc123def456');
    });

    it('リネームされたファイルを含むコミット詳細を正しく変換する', async () => {
      // Arrange
      const mockGitHubCommitWithFiles: GitHubCommitWithFiles = {
        sha: 'rename123',
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
          message: 'Rename file',
          tree: { sha: 'tree123' },
          comment_count: 0,
        },
        author: null,
        committer: null,
        parents: [],
        html_url: 'https://github.com/owner/repo/commit/rename123',
        files: [
          {
            filename: 'new-name.ts',
            status: 'renamed',
            additions: 0,
            deletions: 0,
            changes: 0,
            previous_filename: 'old-name.ts',
          },
        ],
        stats: {
          total: 0,
          additions: 0,
          deletions: 0,
        },
      };

      (mockClient.fetchCommitDetail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockGitHubCommitWithFiles
      );

      // Act
      const result = await service.getCommitDetail('owner', 'repo', 'rename123');

      // Assert
      expect(result.files[0].previousFilename).toBe('old-name.ts');
    });

    it('エラー発生時は例外をスローする', async () => {
      // Arrange
      (mockClient.fetchCommitDetail as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('GitHub API Error')
      );

      // Act & Assert
      await expect(service.getCommitDetail('owner', 'repo', 'invalid')).rejects.toThrow(
        'GitHub API Error'
      );
    });
  });
});
