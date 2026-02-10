import type { CommitDetail } from '@git-canvas/shared/types';
import { useEffect, useState } from 'react';

/**
 * useCommitDetail の戻り値の型
 */
interface UseCommitDetailResult {
  /** コミット詳細データ（取得完了後） */
  data: CommitDetail | null;
  /** ローディング中フラグ */
  isLoading: boolean;
  /** エラー情報（エラー発生時） */
  error: Error | null;
}

/**
 * コミット詳細情報を取得するカスタムフック
 *
 * 責務（SRP）:
 * - コミット詳細APIの呼び出し
 * - ローディング状態の管理
 * - エラー状態の管理
 *
 * @param owner - リポジトリオーナー
 * @param repo - リポジトリ名
 * @param sha - コミットSHA
 * @returns コミット詳細データ、ローディング状態、エラー状態
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCommitDetail('octocat', 'hello-world', 'abc123');
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 * if (data) return <FileList files={data.files} />;
 * ```
 */
export const useCommitDetail = (
  owner: string,
  repo: string,
  sha: string
): UseCommitDetailResult => {
  const [data, setData] = useState<CommitDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // パラメータが不正な場合は何もしない
    if (!owner || !repo || !sha) {
      setIsLoading(false);
      return;
    }

    // 状態をリセット
    setData(null);
    setError(null);
    setIsLoading(true);

    // AbortController でキャンセル可能にする
    const abortController = new AbortController();

    const fetchCommitDetail = async () => {
      try {
        const response = await fetch(
          `/api/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(sha)}`,
          { signal: abortController.signal }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch commit detail: ${response.status} ${response.statusText}`
          );
        }

        const commitDetail: CommitDetail = await response.json();
        setData(commitDetail);
      } catch (err) {
        // AbortError は無視（コンポーネントのアンマウント時）
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommitDetail();

    // クリーンアップ: コンポーネントアンマウント時にリクエストをキャンセル
    return () => {
      abortController.abort();
    };
  }, [owner, repo, sha]);

  return { data, isLoading, error };
};
