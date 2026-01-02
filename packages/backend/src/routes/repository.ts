import type { Request, Response } from 'express';
import { Router } from 'express';
import { GitHubService } from '../services/githubService';

const router = Router();
const githubService = new GitHubService();

/**
 * GET /api/repositories/:owner/:repo/commits
 * リポジトリのコミット一覧を取得
 */
router.get('/:owner/:repo/commits', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const { per_page, page } = req.query;

    const options = {
      per_page: per_page ? Number(per_page) : undefined,
      page: page ? Number(page) : undefined,
    };
    const commits = await githubService.getCommits(owner, repo, options);
    res.json(commits);
  } catch (error) {
    console.error('Failed to fetch commits:', error);

    res.status(500).json({
      error: 'Failed to fetch commits',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/repositories/:owner/:repo/branches
 * リポジトリのブランチ一覧を取得
 */
router.get('/:owner/:repo/branches', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;

    const branches = await githubService.getBranches(owner, repo);

    res.json(branches);
  } catch (error) {
    console.error('Failed to fetch branches:', error);
    res.status(500).json({
      error: 'Failed to fetch branches',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/repositories/:owner/:repo
 * リポジトリの完全な情報を取得（コミット + ブランチ）
 */
router.get('/:owner/:repo', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;

    const repository = await githubService.getRepository(owner, repo);

    res.json(repository);
  } catch (error) {
    console.error('Failed to fetch repository:', error);
    res.status(500).json({
      error: 'Failed to fetch repository',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
