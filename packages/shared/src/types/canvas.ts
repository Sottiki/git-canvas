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

  /** コミット作成日時 */
  date: Date;

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
