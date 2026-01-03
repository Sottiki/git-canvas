import type { CanvasRepository } from '@git-canvas/shared/types';
import { useCallback, useEffect, useState } from 'react';
import { fetchRepository } from '../api/repositoryApi';

/**
 * useRepository フックの戻り値の型
 */
interface UseRepositoryReturn {
  /** リポジトリデータ */
  repository: CanvasRepository | null;
  /** ローディング状態 */
  loading: boolean;
  /** エラー */
  error: Error | null;
  /** 再取得関数 */
  refetch: () => Promise<void>;
}

/**
 * リポジトリ情報を取得するカスタムフック
 *
 * @param owner - リポジトリオーナー
 * @param repo - リポジトリ名
 * @returns リポジトリデータ、ローディング状態、エラー、再取得関数
 */
export const useRepository = (owner: string, repo: string): UseRepositoryReturn => {
  const [repository, setRepository] = useState<CanvasRepository | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // useCallback で関数をメモ化
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRepository(owner, repo);
      setRepository(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [owner, repo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); 

  return {
    repository,
    loading,
    error,
    refetch: fetchData,
  };
};
