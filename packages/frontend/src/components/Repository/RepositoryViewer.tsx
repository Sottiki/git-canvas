import type { CanvasCommit } from '@git-canvas/shared/types';
import { useState } from 'react';
import { useRepository } from '../../hooks/useRepository';
import { CommitDetailModal } from '../CommitDetailModal/CommitDetailModal';
import { GitGraph } from '../GitGraph/GitGraph';
import styles from './RepositoryViewer.module.css';

/**
 * RepositoryViewer のプロパティ
 */
interface RepositoryViewerProps {
  owner: string;
  repo: string;
}

/**
 * リポジトリ情報を表示するコンポーネント
 */
export const RepositoryViewer = ({ owner, repo }: RepositoryViewerProps) => {
  const { repository, loading, error, refetch } = useRepository(owner, repo);

  // コミット詳細モーダル用の状態
  const [selectedCommit, setSelectedCommit] = useState<CanvasCommit | null>(null);

  // コミットノードがクリックされた時のハンドラ
  const handleCommitClick = (commit: CanvasCommit) => {
    setSelectedCommit(commit);
  };

  // モーダルを閉じる時のハンドラ
  const handleCloseModal = () => {
    setSelectedCommit(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Loading repository data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Error loading repository</h3>
          <p>{error.message}</p>
          <button type="button" onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // データがない場合
  if (!repository) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>No repository data available</p>
        </div>
      </div>
    );
  }

  // データ表示
  return (
    <div className={styles.container}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          {repository.owner} / {repository.name}
        </h2>
        <button type="button" className={styles.refreshButton} onClick={refetch} disabled={loading}>
          Refresh
        </button>
      </div>

      {/* Git グラフ */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Commit Graph</h3>
        <GitGraph
          commits={repository.commits}
          branches={repository.branches}
          onCommitClick={handleCommitClick}
        />
      </section>

      {/* ブランチセクション */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Branches <span className={styles.count}>({repository.branches.length})</span>
        </h3>
        <ul className={styles.branchList}>
          {repository.branches.map((branch) => (
            <li key={branch.name} className={styles.branchItem}>
              <span>{branch.name}</span>
              {branch.isProtected && <span className={styles.protectedIcon}>🔒</span>}
            </li>
          ))}
        </ul>
      </section>

      {/* コミットセクション */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Commits <span className={styles.count}>({repository.commits.length})</span>
        </h3>
        <div className={styles.commitList}>
          {repository.commits.map((commit) => (
            <div key={commit.id} className={styles.commitItem}>
              <div className={styles.commitContent}>
                {commit.author.avatarUrl && (
                  <img
                    src={commit.author.avatarUrl}
                    alt={commit.author.name}
                    className={styles.avatar}
                  />
                )}
                <div className={styles.commitDetails}>
                  <div className={styles.commitMessage}>{commit.message}</div>
                  <div className={styles.commitMeta}>
                    <span className={styles.commitAuthor}>{commit.author.name}</span>
                    <span className={styles.commitSha}>{commit.shortId}</span>
                    <span className={styles.commitDate}>
                      {new Date(commit.date).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* コミット詳細モーダル */}
      {selectedCommit && (
        <CommitDetailModal
          commit={selectedCommit}
          owner={owner}
          repo={repo}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};
