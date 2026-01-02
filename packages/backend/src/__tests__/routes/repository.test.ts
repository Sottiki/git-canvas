import type { CanvasBranch, CanvasCommit, CanvasRepository } from '@git-canvas/shared/types';
import type { Express } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';
import { resetGitHubService, setGitHubService } from '../../routes/repository.js';
import type { GitHubService } from '../../services/githubService.js';

describe('Repository Routes', () => {
  let app: Express;
  let mockGitHubService: {
    getCommits: ReturnType<typeof vi.fn>;
    getBranches: ReturnType<typeof vi.fn>;
    getRepository: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockGitHubService = {
      getCommits: vi.fn(),
      getBranches: vi.fn(),
      getRepository: vi.fn(),
    };

    setGitHubService(mockGitHubService as unknown as GitHubService);
    app = createApp();
  });

  afterEach(() => {
    resetGitHubService();
  });

  describe('GET /api/repositories/:owner/:repo/commits', () => {
    it('コミット一覧を正常に取得できる', async () => {
      const mockCommits: CanvasCommit[] = [
        {
          id: 'abc123def456',
          shortId: 'abc123d',
          message: 'Test commit',
          fullMessage: 'Test commit\n\nDetailed description',
          date: new Date('2025-01-01T12:00:00Z'),
          author: {
            name: 'Test User',
            email: 'test@example.com',
            avatarUrl: 'https://example.com/avatar.jpg',
          },
          parentIds: [],
          branchNames: ['main'],
          url: 'https://github.com/owner/repo/commit/abc123',
        },
      ];

      mockGitHubService.getCommits.mockResolvedValueOnce(mockCommits);

      const response = await request(app).get('/api/repositories/Sottiki/git-canvas/commits');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          id: 'abc123def456',
          shortId: 'abc123d',
          message: 'Test commit',
          fullMessage: 'Test commit\n\nDetailed description',
          date: '2025-01-01T12:00:00.000Z', // 文字列
          author: {
            name: 'Test User',
            email: 'test@example.com',
            avatarUrl: 'https://example.com/avatar.jpg',
          },
          parentIds: [],
          branchNames: ['main'],
          url: 'https://github.com/owner/repo/commit/abc123',
        },
      ]);
      expect(mockGitHubService.getCommits).toHaveBeenCalledWith('Sottiki', 'git-canvas', {
        per_page: undefined,
        page: undefined,
      });
    });

    it('ページネーションパラメータを正しく処理する', async () => {
      mockGitHubService.getCommits.mockResolvedValueOnce([]);

      const response = await request(app).get(
        '/api/repositories/Sottiki/git-canvas/commits?per_page=50&page=2'
      );

      expect(response.status).toBe(200);
      expect(mockGitHubService.getCommits).toHaveBeenCalledWith('Sottiki', 'git-canvas', {
        per_page: 50,
        page: 2,
      });
    });

    it('エラー時に500を返す', async () => {
      mockGitHubService.getCommits.mockRejectedValueOnce(new Error('GitHub API Error'));

      const response = await request(app).get('/api/repositories/Sottiki/git-canvas/commits');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to fetch commits',
        message: 'GitHub API Error',
        statusCode: 500,
      });
    });
  });

  describe('GET /api/repositories/:owner/:repo/branches', () => {
    it('ブランチ一覧を正常に取得できる', async () => {
      const mockBranches: CanvasBranch[] = [
        {
          name: 'main',
          latestCommitId: 'abc123',
          isProtected: true,
        },
        {
          name: 'develop',
          latestCommitId: 'def456',
          isProtected: false,
        },
      ];

      mockGitHubService.getBranches.mockResolvedValueOnce(mockBranches);

      const response = await request(app).get('/api/repositories/Sottiki/git-canvas/branches');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBranches);
      expect(mockGitHubService.getBranches).toHaveBeenCalledWith('Sottiki', 'git-canvas');
    });

    it('エラー時に500を返す', async () => {
      mockGitHubService.getBranches.mockRejectedValueOnce(new Error('GitHub API Error'));

      const response = await request(app).get('/api/repositories/Sottiki/git-canvas/branches');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to fetch branches',
        message: 'GitHub API Error',
        statusCode: 500,
      });
    });
  });

  describe('GET /api/repositories/:owner/:repo', () => {
    it('リポジトリ全体の情報を正常に取得できる', async () => {
      const mockRepository: CanvasRepository = {
        owner: 'Sottiki',
        name: 'git-canvas',
        commits: [
          {
            id: 'abc123',
            shortId: 'abc123d',
            message: 'Test commit',
            fullMessage: 'Test commit',
            date: new Date('2025-01-01T12:00:00Z'),
            author: {
              name: 'Test User',
              email: 'test@example.com',
            },
            parentIds: [],
            branchNames: [],
            url: 'https://github.com/owner/repo/commit/abc123',
          },
        ],
        branches: [
          {
            name: 'main',
            latestCommitId: 'abc123',
            isProtected: true,
          },
        ],
      };

      mockGitHubService.getRepository.mockResolvedValueOnce(mockRepository);

      const response = await request(app).get('/api/repositories/Sottiki/git-canvas');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        owner: 'Sottiki',
        name: 'git-canvas',
        commits: [
          {
            id: 'abc123',
            shortId: 'abc123d',
            message: 'Test commit',
            fullMessage: 'Test commit',
            date: '2025-01-01T12:00:00.000Z', // 文字列
            author: {
              name: 'Test User',
              email: 'test@example.com',
            },
            parentIds: [],
            branchNames: [],
            url: 'https://github.com/owner/repo/commit/abc123',
          },
        ],
        branches: [
          {
            name: 'main',
            latestCommitId: 'abc123',
            isProtected: true,
          },
        ],
      });
      expect(mockGitHubService.getRepository).toHaveBeenCalledWith('Sottiki', 'git-canvas');
    });

    it('エラー時に500を返す', async () => {
      mockGitHubService.getRepository.mockRejectedValueOnce(new Error('GitHub API Error'));

      const response = await request(app).get('/api/repositories/Sottiki/git-canvas');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to fetch repository',
        message: 'GitHub API Error',
        statusCode: 500,
      });
    });
  });
});
