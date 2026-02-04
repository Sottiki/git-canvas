import type { GitHubBranch, GitHubCommit, GitHubCommitWithFiles } from '@git-canvas/shared/types';

/**
 * GitHub REST API クライアント
 * 公式ドキュメント: https://docs.github.com/en/rest
 */
export class GitHubClient {
  private readonly baseUrl: string;
  private readonly token: string | undefined;

  /**
   * @param token - GitHub Personal Access Token (オプショナル、レート制限緩和用)
   * @param baseUrl - GitHub API のベースURL（デフォルト: https://api.github.com）
   */
  constructor(token?: string, baseUrl = 'https://api.github.com') {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  /**
   * リポジトリのコミット一覧を取得
   *
   * @param owner - リポジトリオーナー
   * @param repo - リポジトリ名
   * @param options - オプション（per_page, page, sha等）
   * @returns コミット一覧
   */
  async fetchCommits(
    owner: string,
    repo: string,
    options: { per_page?: number; page?: number; sha?: string } = {}
  ): Promise<GitHubCommit[]> {
    const { per_page = 100, page = 1, sha } = options;

    // shaが指定されている場合はクエリパラメータに追加
    const shaParam = sha ? `&sha=${encodeURIComponent(sha)}` : '';
    const url = `${this.baseUrl}/repos/${owner}/${repo}/commits?per_page=${per_page}&page=${page}${shaParam}`;

    const response = await this.request<GitHubCommit[]>(url);
    return response;
  }

  /**
   * リポジトリのブランチ一覧を取得
   *
   * @param owner - リポジトリオーナー
   * @param repo - リポジトリ名
   * @returns ブランチ一覧
   */
  async fetchBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/branches`;

    const response = await this.request<GitHubBranch[]>(url);
    return response;
  }

  /**
   * 単一コミットの詳細情報を取得（ファイル変更情報を含む）
   *
   * GitHub API: GET /repos/{owner}/{repo}/commits/{ref}
   * 公式ドキュメント: https://docs.github.com/en/rest/commits/commits#get-a-commit
   *
   * @param owner - リポジトリオーナー
   * @param repo - リポジトリ名
   * @param sha - コミットSHA
   * @returns ファイル変更情報を含むコミット詳細
   */
  async fetchCommitDetail(
    owner: string,
    repo: string,
    sha: string
  ): Promise<GitHubCommitWithFiles> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/commits/${encodeURIComponent(sha)}`;

    const response = await this.request<GitHubCommitWithFiles>(url);
    return response;
  }

  /**
   * 共通のHTTPリクエスト処理
   *
   * @param url - リクエストURL
   * @returns レスポンスボディ（JSON）
   */
  private async request<T>(url: string): Promise<T> {
    const headers: HeadersInit = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    // トークンがある場合は認証ヘッダーを追加
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { headers });

    // エラーハンドリング
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `GitHub API request failed: ${response.status} ${response.statusText}\n${errorBody}`
      );
    }

    return response.json() as Promise<T>;
  }
}
