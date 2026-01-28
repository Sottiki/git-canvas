import { useCallback, useEffect, useState } from 'react';
import { type AuthUser, fetchAuthStatus, getLoginUrl, logout as logoutApi } from '../api/authApi';

/**
 * useAuth フックの戻り値の型
 */
interface UseAuthReturn {
  /** ログイン中のユーザー情報（未ログインならnull） */
  user: AuthUser | null;
  /** 認証状態の読み込み中かどうか */
  loading: boolean;
  /** 認証済みかどうか */
  isAuthenticated: boolean;
  /** ログインページに遷移 */
  login: () => void;
  /** ログアウト処理 */
  logout: () => Promise<void>;
  /** 認証状態を再取得 */
  refetch: () => Promise<void>;
}

/**
 * 認証状態を管理するカスタムフック
 */
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 認証状態を取得する関数
  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const status = await fetchAuthStatus();
      setUser(status.user);
    } catch (error) {
      console.error('Failed to fetch auth status:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初回マウント時に認証状態を取得
  useEffect(() => {
    refetch();
  }, [refetch]);

  // ログイン処理（GitHubにリダイレクト）
  const login = useCallback(() => {
    window.location.href = getLoginUrl();
  }, []);

  // ログアウト処理
  const logout = useCallback(async () => {
    try {
      await logoutApi();
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }, []);

  return {
    user,
    loading,
    isAuthenticated: user !== null,
    login,
    logout,
    refetch,
  };
};
