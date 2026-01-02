import type {
  CanvasBranch,
  CanvasCommit,
  CanvasRepository,
  ErrorResponse,
} from '@git-canvas/shared/types';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { GitHubService } from '../services/githubService.js';

export const repositoryRouter = Router();

// インスタンスを遅延生成する関数
let githubServiceInstance: GitHubService | null = null;

const getGitHubService = (): GitHubService => {
  if (!githubServiceInstance) {
    githubServiceInstance = new GitHubService();
  }
  return githubServiceInstance;
};

// テスト用：サービスインスタンスをリセット
export const resetGitHubService = (): void => {
  githubServiceInstance = null;
};

// テスト用：サービスインスタンスを設定
export const setGitHubService = (service: GitHubService): void => {
  githubServiceInstance = service;
};

/**
 * コミット一覧取得ハンドラ
 * - リポジトリのコミット一覧を取得
 *
 * @param req - リクエストオブジェクト
 * @param res - レスポンスオブジェクト
 * @returns void
 */
const getCommits = async (
  req: Request,
  res: Response<CanvasCommit[] | ErrorResponse>
): Promise<void> => {
  try {
    const { owner, repo } = req.params;
    const { per_page, page } = req.query;

    const options = {
      per_page: per_page ? Number(per_page) : undefined,
      page: page ? Number(page) : undefined,
    };

    const commits = await getGitHubService().getCommits(owner, repo, options);

    res.json(commits);
  } catch (error) {
    console.error('Failed to fetch commits:', error);
    res.status(500).json({
      error: 'Failed to fetch commits',
      message: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    });
  }
};

/**
 * ブランチ一覧取得ハンドラ
 * - リポジトリのブランチ一覧を取得
 *
 * @param req - リクエストオブジェクト
 * @param res - レスポンスオブジェクト
 * @returns void
 */
const getBranches = async (
  req: Request,
  res: Response<CanvasBranch[] | ErrorResponse>
): Promise<void> => {
  try {
    const { owner, repo } = req.params;

    const branches = await getGitHubService().getBranches(owner, repo);

    res.json(branches);
  } catch (error) {
    console.error('Failed to fetch branches:', error);
    res.status(500).json({
      error: 'Failed to fetch branches',
      message: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    });
  }
};

/**
 * リポジトリ情報取得ハンドラ
 * - リポジトリの完全な情報を取得（コミット + ブランチ）
 *
 * @param req - リクエストオブジェクト
 * @param res - レスポンスオブジェクト
 * @returns void
 */
const getRepository = async (
  req: Request,
  res: Response<CanvasRepository | ErrorResponse>
): Promise<void> => {
  try {
    const { owner, repo } = req.params;

    const repository = await getGitHubService().getRepository(owner, repo);

    res.json(repository);
  } catch (error) {
    console.error('Failed to fetch repository:', error);
    res.status(500).json({
      error: 'Failed to fetch repository',
      message: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    });
  }
};

/**
 * ルーター設定
 *
 * エンドポイント:
 * - GET /api/repositories/:owner/:repo/commits - コミット一覧
 * - GET /api/repositories/:owner/:repo/branches - ブランチ一覧
 * - GET /api/repositories/:owner/:repo - リポジトリ全体
 */
repositoryRouter.get('/:owner/:repo/commits', getCommits);
repositoryRouter.get('/:owner/:repo/branches', getBranches);
repositoryRouter.get('/:owner/:repo', getRepository);
