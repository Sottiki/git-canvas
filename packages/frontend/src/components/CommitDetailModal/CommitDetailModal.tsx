import type { CanvasCommit } from '@git-canvas/shared/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect } from 'react';
import { useCommitDetail } from '../../hooks/useCommitDetail';
import styles from './CommitDetailModal.module.css';

interface CommitDetailModalProps {
  /** 表示するコミット情報 */
  commit: CanvasCommit;
  /** リポジトリオーナー */
  owner: string;
  /** リポジトリ名 */
  repo: string;
  /** モーダルを閉じる時のコールバック */
  onClose: () => void;
}

/**
 * コミット詳細を表示するモーダルコンポーネント
 *
 * 責務（SRP）:
 * - コミットの基本情報を即座に表示
 * - ファイル情報をAPIから取得して遅延表示
 * - ESCキーや背景クリックで閉じる
 */
export const CommitDetailModal = ({ commit, owner, repo, onClose }: CommitDetailModalProps) => {
  // ファイル情報を取得
  const { data: commitDetail, isLoading, error } = useCommitDetail(owner, repo, commit.id);

  // ESCキーでモーダルを閉じる
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 背景クリックでモーダルを閉じる
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // 日付をフォーマット
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ファイルステータスに応じたスタイルクラスを取得
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'added':
        return styles.statusAdded;
      case 'removed':
        return styles.statusRemoved;
      case 'modified':
        return styles.statusModified;
      case 'renamed':
        return styles.statusRenamed;
      default:
        return styles.statusDefault;
    }
  };

  // ファイルステータスの表示名を取得
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'added':
        return '追加';
      case 'removed':
        return '削除';
      case 'modified':
        return '変更';
      case 'renamed':
        return '名前変更';
      case 'copied':
        return 'コピー';
      default:
        return status;
    }
  };

  // マージコミット判定
  const isMergeCommit = commit.parentIds.length >= 2;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.backdrop}
        onClick={handleBackdropClick}
        data-testid="modal-backdrop"
        {...{
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.2 },
        }}
      >
        <motion.div
          className={styles.modal}
          role="dialog"
          aria-labelledby="commit-detail-title"
          aria-modal="true"
          {...{
            initial: { opacity: 0, scale: 0.9, y: 20 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.9, y: 20 },
            transition: { duration: 0.2, type: 'spring', damping: 25 },
          }}
        >
          {/* ヘッダー */}
          <div className={styles.header}>
            <h2 id="commit-detail-title" className={styles.title}>
              {isMergeCommit && <span className={styles.mergeTag}>Merge</span>}
              コミット詳細
            </h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="閉じる"
              data-testid="close-button"
            >
              ✕
            </button>
          </div>

          {/* コンテンツ */}
          <div className={styles.content}>
            {/* SHA */}
            <div className={styles.section}>
              <span className={styles.sectionLabel}>SHA</span>
              <code className={styles.sha} data-testid="commit-sha">
                {commit.id}
              </code>
            </div>

            {/* メッセージ */}
            <div className={styles.section}>
              <span className={styles.sectionLabel}>メッセージ</span>
              <pre className={styles.message} data-testid="commit-message">
                {commit.fullMessage}
              </pre>
            </div>

            {/* 作者 */}
            <div className={styles.section}>
              <span className={styles.sectionLabel}>作者</span>
              <div className={styles.author} data-testid="commit-author">
                {commit.author.avatarUrl && (
                  <img
                    src={commit.author.avatarUrl}
                    alt={`${commit.author.name}のアバター`}
                    className={styles.avatar}
                  />
                )}
                <span className={styles.authorName}>{commit.author.name}</span>
                <span className={styles.authorEmail}>&lt;{commit.author.email}&gt;</span>
              </div>
            </div>

            {/* 日付 */}
            <div className={styles.section}>
              <span className={styles.sectionLabel}>日時</span>
              <time className={styles.date} dateTime={commit.date} data-testid="commit-date">
                {formatDate(commit.date)}
              </time>
            </div>

            {/* 親コミット */}
            {commit.parentIds.length > 0 && (
              <div className={styles.section}>
                <span className={styles.sectionLabel}>
                  親コミット {isMergeCommit && `(${commit.parentIds.length})`}
                </span>
                <div className={styles.parents} data-testid="commit-parents">
                  {commit.parentIds.map((parentId) => (
                    <code key={parentId} className={styles.parentSha}>
                      {parentId.slice(0, 7)}
                    </code>
                  ))}
                </div>
              </div>
            )}

            {/* ブランチ */}
            {commit.branchNames.length > 0 && (
              <div className={styles.section}>
                <span className={styles.sectionLabel}>ブランチ</span>
                <div className={styles.branches} data-testid="commit-branches">
                  {commit.branchNames.map((branch) => (
                    <span key={branch} className={styles.branchTag}>
                      {branch}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ファイル情報 */}
            <div className={styles.section}>
              <span className={styles.sectionLabel}>
                変更ファイル
                {commitDetail && ` (${commitDetail.files.length})`}
              </span>

              {/* ローディング状態 */}
              {isLoading && (
                <div className={styles.filesLoading} data-testid="files-loading">
                  <div className={styles.spinner} />
                  <span>ファイル情報を取得中...</span>
                </div>
              )}

              {/* エラー状態 */}
              {error && (
                <div className={styles.filesError} data-testid="files-error">
                  <span>ファイル情報の取得に失敗しました</span>
                  <span className={styles.errorDetail}>{error.message}</span>
                </div>
              )}

              {/* ファイル一覧 */}
              {commitDetail && !isLoading && !error && (
                <>
                  {/* 統計サマリー */}
                  <div className={styles.statsSummary} data-testid="files-stats">
                    <span className={styles.statsAdditions}>+{commitDetail.stats.additions}</span>
                    <span className={styles.statsDeletions}>-{commitDetail.stats.deletions}</span>
                    <span className={styles.statsTotal}>({commitDetail.stats.total} 行変更)</span>
                  </div>

                  {/* ファイルリスト */}
                  <ul className={styles.fileList} data-testid="files-list">
                    {commitDetail.files.map((file) => (
                      <li key={file.filename} className={styles.fileItem}>
                        <span className={`${styles.fileStatus} ${getStatusClass(file.status)}`}>
                          {getStatusLabel(file.status)}
                        </span>
                        <span className={styles.fileName}>
                          {file.previousFilename && (
                            <span className={styles.previousFileName}>
                              {file.previousFilename} →{' '}
                            </span>
                          )}
                          {file.filename}
                        </span>
                        <span className={styles.fileChanges}>
                          <span className={styles.fileAdditions}>+{file.additions}</span>
                          <span className={styles.fileDeletions}>-{file.deletions}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* フッター */}
          <div className={styles.footer}>
            <a
              href={commit.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubLink}
              data-testid="github-link"
            >
              GitHubで見る ↗
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
