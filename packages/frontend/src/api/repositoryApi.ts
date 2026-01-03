import type { CanvasBranch, CanvasCommit, CanvasRepository } from '@git-canvas/shared/types';

// APIのベースURL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * リポジトリのコミット一覧を取得
 *
 * @param owner - リポジトリオーナー
 * @param repo - リポジトリ名
 * @param options - ページネーションオプション
 * @returns コミット一覧
 */
export const fetchCommits = async (
  owner: string,
  repo: string,
  options?: { per_page?: number; page?: number }
): Promise<CanvasCommit[]> => {
  // fetchURLの準備
  const params = new URLSearchParams();
  if (options?.per_page) params.append('per_page', options.per_page.toString());
  if (options?.page) params.append('page', options.page.toString());

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const url = `${API_BASE_URL}/repositories/${owner}/${repo}/commits${queryString}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch commits: ${response.statusText}`);
  }

  return response.json();
};

/**
 * リポジトリのブランチ一覧を取得
 *
 * @param owner - リポジトリオーナー
 * @param repo - リポジトリ名
 * @returns ブランチ一覧
 */
export const fetchBranches = async (owner: string, repo: string): Promise<CanvasBranch[]> => {
  const url = `${API_BASE_URL}/repositories/${owner}/${repo}/branches`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch branches: ${response.statusText}`);
  }

  return response.json();
};

/**
 * リポジトリの完全な情報を取得（コミット + ブランチ）
 *
 * @param owner - リポジトリオーナー
 * @param repo - リポジトリ名
 * @returns リポジトリ情報
 */
export const fetchRepository = async (owner: string, repo: string): Promise<CanvasRepository> => {
  const url = `${API_BASE_URL}/repositories/${owner}/${repo}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch repository: ${response.statusText}`);
  }

  return response.json();
};
