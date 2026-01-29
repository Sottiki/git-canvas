import type { AuthStatusResponse, AuthUser } from '@git-canvas/shared/types';

// 型定義を再エクスポート（他のファイルで使いやすくするため）
export type { AuthStatusResponse, AuthUser };

// APIのベースURL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * 現在の認証状態を取得
 */
export const fetchAuthStatus = async (): Promise<AuthStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch auth status: ${response.statusText}`);
  }

  return response.json();
};

/**
 * ログアウト
 */
export const logout = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to logout: ${response.statusText}`);
  }
};

/**
 * ログインページのURLを取得
 */
export const getLoginUrl = (): string => {
  return `${API_BASE_URL}/auth/login`;
};
