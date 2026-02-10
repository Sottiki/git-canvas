import type { GitHubBranch, GitHubCommit, GitHubCommitWithFiles } from '@git-canvas/shared/types';
import { describe, expect, it } from 'vitest';
import {
  convertToCanvasBranch,
  convertToCanvasCommit,
  convertToCommitDetail,
} from '../../services/githubConverter.js';

describe('githubConverter', () => {
  describe('convertToCanvasCommit', () => {
    it('GitHub APIのコミット情報をCanvas内部形式に正しく変換する', () => {
      // Arrange: テストデータ準備
      const githubCommit: GitHubCommit = {
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
          message: 'Fix: bug fix\n\nDetailed description here',
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
        parents: [{ sha: 'parent123' }, { sha: 'parent456' }],
        html_url: 'https://github.com/owner/repo/commit/abc123',
      };

      const branchNames = ['main', 'feature/test'];

      // Act: 変換実行
      const result = convertToCanvasCommit(githubCommit, branchNames);

      // Assert: 期待値検証
      expect(result).toEqual({
        id: 'abc123def456789012345678901234567890abcd',
        shortId: 'abc123d',
        message: 'Fix: bug fix',
        fullMessage: 'Fix: bug fix\n\nDetailed description here',
        date: '2025-01-01T12:00:00Z',
        author: {
          name: 'Test User',
          email: 'test@example.com',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        parentIds: ['parent123', 'parent456'],
        branchNames: ['main', 'feature/test'],
        url: 'https://github.com/owner/repo/commit/abc123',
      });
    });

    it('コミットメッセージが1行のみの場合も正しく処理する', () => {
      const githubCommit: GitHubCommit = {
        sha: 'short123',
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
          message: 'Single line commit message',
          tree: { sha: 'tree123' },
          comment_count: 0,
        },
        author: null, // Botコミットなど
        committer: null,
        parents: [],
        html_url: 'https://github.com/owner/repo/commit/short123',
      };

      const result = convertToCanvasCommit(githubCommit);

      expect(result.message).toBe('Single line commit message');
      expect(result.fullMessage).toBe('Single line commit message');
      expect(result.author.avatarUrl).toBeUndefined();
      expect(result.parentIds).toEqual([]);
      expect(result.branchNames).toEqual([]);
    });

    it('空のメッセージでもエラーにならない', () => {
      const githubCommit: GitHubCommit = {
        sha: 'empty123',
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
          message: '',
          tree: { sha: 'tree123' },
          comment_count: 0,
        },
        author: null,
        committer: null,
        parents: [],
        html_url: 'https://github.com/owner/repo/commit/empty123',
      };

      const result = convertToCanvasCommit(githubCommit);

      expect(result.message).toBe('');
      expect(result.fullMessage).toBe('');
    });
  });

  describe('convertToCanvasBranch', () => {
    it('GitHub APIのブランチ情報をCanvas内部形式に正しく変換する', () => {
      const githubBranch: GitHubBranch = {
        name: 'main',
        commit: {
          sha: 'abc123def456',
          url: 'https://api.github.com/repos/owner/repo/commits/abc123',
        },
        protected: true,
      };

      const result = convertToCanvasBranch(githubBranch);

      expect(result).toEqual({
        name: 'main',
        latestCommitId: 'abc123def456',
        isProtected: true,
      });
      expect(result.color).toBeUndefined();
    });

    it('保護されていないブランチも正しく変換する', () => {
      const githubBranch: GitHubBranch = {
        name: 'feature/test',
        commit: {
          sha: 'feature123',
          url: 'https://api.github.com/repos/owner/repo/commits/feature123',
        },
        protected: false,
      };

      const result = convertToCanvasBranch(githubBranch);

      expect(result.isProtected).toBe(false);
    });
  });

  describe('convertToCommitDetail', () => {
    it('GitHub APIのコミット詳細情報をCommitDetail型に正しく変換する', () => {
      // Arrange: テストデータ準備
      const githubCommitWithFiles: GitHubCommitWithFiles = {
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

      // Act: 変換実行
      const result = convertToCommitDetail(githubCommitWithFiles);

      // Assert: 期待値検証
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
    });

    it('リネームされたファイルのprevious_filenameを正しく変換する', () => {
      // Arrange
      const githubCommitWithFiles: GitHubCommitWithFiles = {
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

      // Act
      const result = convertToCommitDetail(githubCommitWithFiles);

      // Assert
      expect(result.files[0]).toEqual({
        filename: 'new-name.ts',
        status: 'renamed',
        additions: 0,
        deletions: 0,
        changes: 0,
        previousFilename: 'old-name.ts',
      });
    });

    it('ファイルが空の場合も正しく処理する', () => {
      // Arrange
      const githubCommitWithFiles: GitHubCommitWithFiles = {
        sha: 'empty123',
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
          message: 'Empty commit',
          tree: { sha: 'tree123' },
          comment_count: 0,
        },
        author: null,
        committer: null,
        parents: [],
        html_url: 'https://github.com/owner/repo/commit/empty123',
        files: [],
        stats: {
          total: 0,
          additions: 0,
          deletions: 0,
        },
      };

      // Act
      const result = convertToCommitDetail(githubCommitWithFiles);

      // Assert
      expect(result.sha).toBe('empty123');
      expect(result.files).toEqual([]);
      expect(result.stats).toEqual({
        total: 0,
        additions: 0,
        deletions: 0,
      });
    });

    it('様々なファイルステータスを正しく変換する', () => {
      // Arrange
      const githubCommitWithFiles: GitHubCommitWithFiles = {
        sha: 'various123',
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
          message: 'Various changes',
          tree: { sha: 'tree123' },
          comment_count: 0,
        },
        author: null,
        committer: null,
        parents: [],
        html_url: 'https://github.com/owner/repo/commit/various123',
        files: [
          { filename: 'added.ts', status: 'added', additions: 10, deletions: 0, changes: 10 },
          { filename: 'removed.ts', status: 'removed', additions: 0, deletions: 20, changes: 20 },
          { filename: 'modified.ts', status: 'modified', additions: 5, deletions: 3, changes: 8 },
          {
            filename: 'copied.ts',
            status: 'copied',
            additions: 0,
            deletions: 0,
            changes: 0,
            previous_filename: 'original.ts',
          },
        ],
        stats: {
          total: 38,
          additions: 15,
          deletions: 23,
        },
      };

      // Act
      const result = convertToCommitDetail(githubCommitWithFiles);

      // Assert
      expect(result.files).toHaveLength(4);
      expect(result.files[0].status).toBe('added');
      expect(result.files[1].status).toBe('removed');
      expect(result.files[2].status).toBe('modified');
      expect(result.files[3].status).toBe('copied');
      expect(result.files[3].previousFilename).toBe('original.ts');
    });
  });
});
