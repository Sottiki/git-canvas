import type { GitHubBranch, GitHubCommit } from '@git-canvas/shared/types';
import { describe, expect, it } from 'vitest';
import { convertToCanvasBranch, convertToCanvasCommit } from '../../services/githubConverter.js';

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
});
