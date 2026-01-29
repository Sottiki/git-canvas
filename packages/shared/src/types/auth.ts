/**
 * 認証関連の型定義
 */

/**
 * 認証済みユーザー情報
 */
export interface AuthUser {
  /** GitHubユーザーID */
  id: number;
  /** GitHubユーザー名 */
  login: string;
  /** 表示名（設定されていない場合はnull） */
  name: string | null;
  /** アバター画像URL */
  avatarUrl: string;
}

/**
 * 認証状態のレスポンス型
 * GET /api/auth/me のレスポンス
 */
export interface AuthStatusResponse {
  /** 認証済みかどうか */
  authenticated: boolean;
  /** ユーザー情報（未認証の場合はnull） */
  user: AuthUser | null;
}
