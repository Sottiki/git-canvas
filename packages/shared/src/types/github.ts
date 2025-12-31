/**
 * GitHub REST API v3 のレスポンス型定義
 * 公式ドキュメント: https://docs.github.com/en/rest
 *
 * 外部APIとの通信にのみ使用し、
 * アプリケーション内部ではCanvasCommit等に変換して使用する
 */

/**
 * GitHubユーザー情報
 */
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

/**
 * コミット作成者情報（Git上の情報）
 */
export interface GitHubCommitAuthor {
  name: string;
  email: string;
  date: string; // ISO 8601 format
}

/**
 * コミット詳細情報
 */
export interface GitHubCommitDetail {
  author: GitHubCommitAuthor;
  committer: GitHubCommitAuthor;
  message: string;
  tree: {
    sha: string;
  };
  comment_count: number;
}

/**
 * コミット情報（GET /repos/{owner}/{repo}/commits のレスポンス）
 */
export interface GitHubCommit {
  sha: string;
  commit: GitHubCommitDetail;
  author: GitHubUser | null;
  committer: GitHubUser | null;
  parents: Array<{
    sha: string;
  }>;
  html_url: string;
}

/**
 * ブランチ情報（GET /repos/{owner}/{repo}/branches のレスポンス）
 */
export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}
