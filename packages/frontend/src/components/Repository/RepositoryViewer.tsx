import { useRepository } from '../../hooks/useRepository';
import styles from './RepositoryViewer.module.css';

/**
 * RepositoryViewer のプロパティ
 */
interface RepositoryViewerProps {
  /** リポジトリオーナー */
  owner: string;
  /** リポジトリ名 */
  repo: string;
}

/**
 * リポジトリ情報を表示するコンポーネント
 */
export const RepositoryViewer = ({ owner, repo }: RepositoryViewerProps) => {
  const { repository, loading, error, refetch } = useRepository(owner, repo);

  // ローディング表示
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Loading repository data...</p>
        </div>
      </div>
    );
  }

  // エラー表示
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
        <button type="button" className={styles.refreshButton} onClick={refetch}>
          Refresh
        </button>
      </div>

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
    </div>
  );
};
