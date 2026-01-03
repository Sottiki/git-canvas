import { useRepository } from '../../hooks/useRepository';

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
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading repository data...</p>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h3>Error loading repository</h3>
        <p>{error.message}</p>
        <button type="button" onClick={refetch}>
          Retry
        </button>
      </div>
    );
  }

  // データがない場合
  if (!repository) {
    return (
      <div style={{ padding: '20px' }}>
        <p>No repository data available</p>
      </div>
    );
  }

  // データ表示
  return (
    <div style={{ padding: '20px' }}>
      <h2>
        {repository.owner} / {repository.name}
      </h2>

      <section style={{ marginTop: '20px' }}>
        <h3>Branches ({repository.branches.length})</h3>
        <ul>
          {repository.branches.map((branch) => (
            <li key={branch.name}>
              {branch.name}
              {branch.isProtected && ' 🔒'}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h3>Commits ({repository.commits.length})</h3>
        <div>
          {repository.commits.map((commit) => (
            <div
              key={commit.id}
              style={{
                borderBottom: '1px solid #eee',
                padding: '10px 0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {commit.author.avatarUrl && (
                  <img
                    src={commit.author.avatarUrl}
                    alt={commit.author.name}
                    style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{commit.message}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {commit.author.name} · {commit.shortId} ·{' '}
                    {new Date(commit.date).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button type="button" onClick={refetch} style={{ marginTop: '20px' }}>
        Refresh
      </button>
    </div>
  );
};
