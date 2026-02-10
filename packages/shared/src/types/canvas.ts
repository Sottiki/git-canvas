/**
 * GitCanvasアプリケーション内部で使用する型定義
 * UIレンダリング用データ構造
 */

/**
 * コミット作成者情報
 */
export interface CanvasAuthor {
  name: string;
  email: string;
  avatarUrl?: string;
}

/**
 * GitCanvasで扱うコミット情報
 * UIレンダリングに最適化
 */
export interface CanvasCommit {
  /** コミットハッシュ（完全版） */
  id: string;

  /** 表示用の短縮SHA（7文字） */
  shortId: string;

  /** コミットメッセージ1行目（要約） */
  message: string;

  /** 完全なコミットメッセージ */
  fullMessage: string;

  /** コミット作成日時（ISO 8601形式の文字列） */
  date: string;

  /** コミット作成者情報 */
  author: CanvasAuthor;

  /** 親コミットのIDリスト（グラフ描画用） */
  parentIds: string[];

  /** このコミットが属するブランチ名リスト */
  branchNames: string[];

  /** GitHub上のコミットページURL */
  url: string;
}

/**
 * GitCanvasで扱うブランチ情報
 */
export interface CanvasBranch {
  /** ブランチ名 */
  name: string;

  /** 最新コミットのID */
  latestCommitId: string;

  /** 保護されたブランチかどうか */
  isProtected: boolean;

  /** UI表示用の色（オプショナル） */
  color?: string;
}

/**
 * リポジトリ全体の情報
 */
export interface CanvasRepository {
  /** リポジトリオーナー */
  owner: string;

  /** リポジトリ名 */
  name: string;

  /** コミットリスト */
  commits: CanvasCommit[];

  /** ブランチリスト */
  branches: CanvasBranch[];
}

/**
 * コミットで変更されたファイルの情報
 */
export interface CommitFile {
  /** ファイル名（パス付き） */
  filename: string;

  /** ファイルの変更ステータス */
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';

  /** 追加行数 */
  additions: number;

  /** 削除行数 */
  deletions: number;

  /** 変更行数（additions + deletions） */
  changes: number;

  /** リネーム前のファイル名（status が renamed の場合のみ） */
  previousFilename?: string;
}

/**
 * コミットの変更統計情報
 */
export interface CommitStats {
  /** 総変更行数 */
  total: number;

  /** 追加行数 */
  additions: number;

  /** 削除行数 */
  deletions: number;
}

/**
 * コミット詳細情報（ファイル変更情報を含む）
 * モーダル表示用に最適化
 */
export interface CommitDetail {
  /** コミットSHA */
  sha: string;

  /** 変更ファイル一覧 */
  files: CommitFile[];

  /** 変更統計 */
  stats: CommitStats;
}
