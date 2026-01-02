import type { CanvasBranch, CanvasCommit, CanvasRepository } from '@git-canvas/shared';
import { GitHubClient } from './githubClient';
import { convertToCanvasBranch, convertToCanvasCommit } from './githubConverter';

/**
 * GitHub Service Module
 */
export class GitHubService {
  private readonly client: GitHubClient;

  /**
   * @param client - GitHubClient（省略時は環境変数から自動生成）
   */
  constructor(client?: GitHubClient) {
    this.client = client ?? GitHubService.createDefaultClient();
  }

  /**
   * 本番用の GitHubClient を生成する
   * 環境変数からトークン、ベースURLを取得
   */
  private static createDefaultClient(): GitHubClient {
    const token = process.env.GITHUB_TOKEN;
    const baseUrl = process.env.GITHUB_API_BASE_URL;
    return new GitHubClient(token, baseUrl);
  }

  /**
   * リポジトリのコミット一覧を取得（Canvas型）
   *
   * @param owner - リポジトリオーナー
   * @param repo - リポジトリ名
   * @param options - ページネーションオプション
   * @returns Canvas内部型のコミット一覧
   */
  public async getCommits(
    owner: string,
    repo: string,
    options?: { per_page?: number; page?: number }
  ): Promise<CanvasCommit[]> {
    // GitHub API からコミット取得
    const githubCommits = await this.client.fetchCommits(owner, repo, options);

    // Canvas型に変換
    const canvasCommits = githubCommits.map((commit) => convertToCanvasCommit(commit));

    return canvasCommits;
  }

  /**
   * リポジトリのブランチ一覧を取得
   *
   * @param owner - リポジトリオーナー
   * @param repo - リポジトリ名
   * @returns Canvas内部型のブランチ一覧
   */
  public async getBranches(owner: string, repo: string): Promise<CanvasBranch[]> {
    // GitHub API からブランチ取得
    const githubBranches = await this.client.fetchBranches(owner, repo);

    // Canvas型に変換
    const canvasBranches = githubBranches.map((branch) => convertToCanvasBranch(branch));

    return canvasBranches;
  }

  /**
   * リポジトリの完全な情報を取得（コミット&ブランチ）
   *
   * @param owner - リポジトリオーナー
   * @param repo - リポジトリ名
   * @returns コミットとブランチの情報を含むオブジェクト
   */
  public async getRepository(owner: string, repo: string): Promise<CanvasRepository> {
    const [commits, branches] = await Promise.all([
      this.getCommits(owner, repo),
      this.getBranches(owner, repo),
    ]);
    return {
      owner,
      name: repo,
      commits,
      branches,
    };
  }
}
