import type {
  CanvasBranch,
  CanvasCommit,
  CanvasRepository,
  CommitDetail,
  GitHubCommit,
} from '@git-canvas/shared';
import { GitHubClient } from './githubClient';
import {
  convertToCanvasBranch,
  convertToCanvasCommit,
  convertToCommitDetail,
} from './githubConverter';

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
   * 全ブランチのコミットを取得してマージします
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
    // まずブランチ一覧を取得
    const branches = await this.getBranches(owner, repo);

    // 各ブランチのコミットを並列取得
    const branchCommitsPromises = branches.map((branch) =>
      this.client.fetchCommits(owner, repo, {
        ...options,
        sha: branch.name, // ブランチ名を指定
      })
    );

    const branchCommitsArrays = await Promise.all(branchCommitsPromises);

    // 全ブランチのコミットをフラット化し、重複を除去（SHAでユニーク化）
    const commitMap = new Map<string, GitHubCommit>();
    for (const commits of branchCommitsArrays) {
      for (const commit of commits) {
        commitMap.set(commit.sha, commit);
      }
    }
    const githubCommits = Array.from(commitMap.values());

    // コミットSHA → ブランチ名リストのマップを構築
    const commitToBranches = this.buildCommitToBranchesMap(githubCommits, branches);

    // Canvas型に変換（branchNames付き）
    const canvasCommits = githubCommits.map((commit) => {
      const branchNames = commitToBranches.get(commit.sha) ?? [];
      return convertToCanvasCommit(commit, branchNames);
    });

    return canvasCommits;
  }

  /**
   * コミットSHA → ブランチ名リストのマップを構築
   *
   * 各コミットが、どのブランチに属するかを判定します。
   * - ブランチの最新コミット → そのブランチに所属
   * - 親コミット → 子コミットのブランチを継承
   *
   * @param commits - コミット一覧
   * @param branches - ブランチ一覧
   * @returns コミットSHA → ブランチ名配列のマップ
   */
  private buildCommitToBranchesMap(
    commits: GitHubCommit[],
    branches: CanvasBranch[]
  ): Map<string, string[]> {
    const map = new Map<string, string[]>();

    // Step 1: ブランチの最新コミットをマッピング
    for (const branch of branches) {
      const existingBranches = map.get(branch.latestCommitId) ?? [];
      map.set(branch.latestCommitId, [...existingBranches, branch.name]);
    }

    // Step 2: 親コミットへブランチ情報を伝播
    // コミットを新しい順（子→親の順）で処理
    const sortedCommits = [...commits].sort((a, b) => {
      return new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime();
    });

    for (const commit of sortedCommits) {
      const branchNames = map.get(commit.sha);

      // このコミットがブランチに属している場合、親にも伝播
      if (branchNames && branchNames.length > 0) {
        for (const parent of commit.parents) {
          const parentBranches = map.get(parent.sha) ?? [];
          // 親にブランチ情報を追加（重複を除く）
          const mergedBranches = Array.from(new Set([...parentBranches, ...branchNames]));
          map.set(parent.sha, mergedBranches);
        }
      }
    }

    return map;
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

  /**
   * 単一コミットの詳細情報を取得（ファイル変更情報を含む）
   *
   * @param owner - リポジトリオーナー
   * @param repo - リポジトリ名
   * @param sha - コミットSHA
   * @returns ファイル変更情報を含むコミット詳細
   */
  public async getCommitDetail(owner: string, repo: string, sha: string): Promise<CommitDetail> {
    // GitHub API からコミット詳細を取得
    const githubCommit = await this.client.fetchCommitDetail(owner, repo, sha);

    // Canvas型に変換
    const commitDetail = convertToCommitDetail(githubCommit);

    return commitDetail;
  }
}
