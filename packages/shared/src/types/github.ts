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

/**
 * コミットで変更されたファイルの情報（GitHub API レスポンス）
 * GET /repos/{owner}/{repo}/commits/{ref} のレスポンスに含まれる
 */
export interface GitHubCommitFile {
  /** ファイル名（パス付き） */
  filename: string;

  /** ファイルの変更ステータス */
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';

  /** 追加行数 */
  additions: number;

  /** 削除行数 */
  deletions: number;

  /** 変更行数 */
  changes: number;

  /** パッチ内容（diff） */
  patch?: string;

  /** リネーム前のファイル名 */
  previous_filename?: string;
}

/**
 * コミット統計情報（GitHub API レスポンス）
 */
export interface GitHubCommitStats {
  /** 総変更行数 */
  total: number;

  /** 追加行数 */
  additions: number;

  /** 削除行数 */
  deletions: number;
}

/**
 * 単一コミットの詳細情報（ファイル情報付き）
 * GET /repos/{owner}/{repo}/commits/{ref} のレスポンス
 */
export interface GitHubCommitWithFiles extends GitHubCommit {
  /** 変更ファイル一覧 */
  files: GitHubCommitFile[];

  /** 変更統計 */
  stats: GitHubCommitStats;
}
