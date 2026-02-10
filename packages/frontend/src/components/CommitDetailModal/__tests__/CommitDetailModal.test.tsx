import type { CanvasCommit, CommitDetail } from '@git-canvas/shared/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommitDetailModal } from '../CommitDetailModal';

// useCommitDetailフックをモック
vi.mock('../../../hooks/useCommitDetail', () => ({
  useCommitDetail: vi.fn(),
}));

import { useCommitDetail } from '../../../hooks/useCommitDetail';

const mockUseCommitDetail = vi.mocked(useCommitDetail);

describe('CommitDetailModal', () => {
  const mockCommit: CanvasCommit = {
    id: 'abc123def456789full',
    shortId: 'abc123d',
    message: 'Add new feature',
    fullMessage: 'Add new feature\n\nThis is a detailed description\nwith multiple lines.',
    date: '2025-01-15T10:30:00Z',
    author: {
      name: 'Test User',
      email: 'test@example.com',
      avatarUrl: 'https://example.com/avatar.png',
    },
    parentIds: ['parent123'],
    branchNames: ['main', 'feature/test'],
    url: 'https://github.com/test/repo/commit/abc123def456789full',
  };

  const mockCommitDetail: CommitDetail = {
    sha: 'abc123def456789full',
    files: [
      {
        filename: 'src/index.ts',
        status: 'modified',
        additions: 10,
        deletions: 5,
        changes: 15,
      },
      {
        filename: 'README.md',
        status: 'added',
        additions: 20,
        deletions: 0,
        changes: 20,
      },
      {
        filename: 'old-file.ts',
        status: 'removed',
        additions: 0,
        deletions: 30,
        changes: 30,
      },
    ],
    stats: {
      total: 65,
      additions: 30,
      deletions: 35,
    },
  };

  const mockOnClose = vi.fn();
  const defaultProps = {
    commit: mockCommit,
    owner: 'testowner',
    repo: 'testrepo',
    onClose: mockOnClose,
  };

  beforeEach(() => {
    mockOnClose.mockClear();
    mockUseCommitDetail.mockReset();
  });

  describe('基本表示', () => {
    beforeEach(() => {
      mockUseCommitDetail.mockReturnValue({
        data: mockCommitDetail,
        isLoading: false,
        error: null,
      });
    });

    it('モーダルがレンダリングされる', () => {
      render(<CommitDetailModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('コミットSHAが表示される', () => {
      render(<CommitDetailModal {...defaultProps} />);

      const sha = screen.getByTestId('commit-sha');
      expect(sha).toHaveTextContent('abc123def456789full');
    });

    it('完全なコミットメッセージが表示される', () => {
      render(<CommitDetailModal {...defaultProps} />);

      const message = screen.getByTestId('commit-message');
      expect(message).toHaveTextContent('Add new feature');
      expect(message).toHaveTextContent('This is a detailed description');
    });

    it('作者情報が表示される', () => {
      render(<CommitDetailModal {...defaultProps} />);

      const author = screen.getByTestId('commit-author');
      expect(author).toHaveTextContent('Test User');
      expect(author).toHaveTextContent('test@example.com');
    });

    it('GitHubリンクが正しいURLで表示される', () => {
      render(<CommitDetailModal {...defaultProps} />);

      const link = screen.getByTestId('github-link');
      expect(link).toHaveAttribute(
        'href',
        'https://github.com/test/repo/commit/abc123def456789full'
      );
    });
  });

  describe('ファイル情報の表示', () => {
    it('ローディング中はスピナーが表示される', () => {
      mockUseCommitDetail.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<CommitDetailModal {...defaultProps} />);

      expect(screen.getByTestId('files-loading')).toBeInTheDocument();
      expect(screen.getByText('ファイル情報を取得中...')).toBeInTheDocument();
    });

    it('エラー時はエラーメッセージが表示される', () => {
      mockUseCommitDetail.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error'),
      });

      render(<CommitDetailModal {...defaultProps} />);

      expect(screen.getByTestId('files-error')).toBeInTheDocument();
      expect(screen.getByText('ファイル情報の取得に失敗しました')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('ファイル統計が表示される', () => {
      mockUseCommitDetail.mockReturnValue({
        data: mockCommitDetail,
        isLoading: false,
        error: null,
      });

      render(<CommitDetailModal {...defaultProps} />);

      const stats = screen.getByTestId('files-stats');
      expect(stats).toHaveTextContent('+30');
      expect(stats).toHaveTextContent('-35');
      expect(stats).toHaveTextContent('65 行変更');
    });

    it('ファイル一覧が表示される', () => {
      mockUseCommitDetail.mockReturnValue({
        data: mockCommitDetail,
        isLoading: false,
        error: null,
      });

      render(<CommitDetailModal {...defaultProps} />);

      const fileList = screen.getByTestId('files-list');
      expect(fileList).toBeInTheDocument();

      expect(screen.getByText('src/index.ts')).toBeInTheDocument();
      expect(screen.getByText('README.md')).toBeInTheDocument();
      expect(screen.getByText('old-file.ts')).toBeInTheDocument();
    });

    it('ファイルステータスが正しく表示される', () => {
      mockUseCommitDetail.mockReturnValue({
        data: mockCommitDetail,
        isLoading: false,
        error: null,
      });

      render(<CommitDetailModal {...defaultProps} />);

      expect(screen.getByText('変更')).toBeInTheDocument();
      expect(screen.getByText('追加')).toBeInTheDocument();
      expect(screen.getByText('削除')).toBeInTheDocument();
    });

    it('ファイル数がラベルに表示される', () => {
      mockUseCommitDetail.mockReturnValue({
        data: mockCommitDetail,
        isLoading: false,
        error: null,
      });

      render(<CommitDetailModal {...defaultProps} />);

      expect(screen.getByText(/変更ファイル.*\(3\)/)).toBeInTheDocument();
    });
  });

  describe('リネームファイルの表示', () => {
    it('リネーム前のファイル名が表示される', () => {
      const commitDetailWithRename: CommitDetail = {
        sha: 'abc123',
        files: [
          {
            filename: 'new-name.ts',
            status: 'renamed',
            additions: 0,
            deletions: 0,
            changes: 0,
            previousFilename: 'old-name.ts',
          },
        ],
        stats: { total: 0, additions: 0, deletions: 0 },
      };

      mockUseCommitDetail.mockReturnValue({
        data: commitDetailWithRename,
        isLoading: false,
        error: null,
      });

      render(<CommitDetailModal {...defaultProps} />);

      expect(screen.getByText('old-name.ts →')).toBeInTheDocument();
      expect(screen.getByText('new-name.ts')).toBeInTheDocument();
      expect(screen.getByText('名前変更')).toBeInTheDocument();
    });
  });

  describe('useCommitDetailの呼び出し', () => {
    it('正しいパラメータでuseCommitDetailが呼ばれる', () => {
      mockUseCommitDetail.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<CommitDetailModal {...defaultProps} />);

      expect(mockUseCommitDetail).toHaveBeenCalledWith(
        'testowner',
        'testrepo',
        'abc123def456789full'
      );
    });
  });

  describe('閉じる操作', () => {
    beforeEach(() => {
      mockUseCommitDetail.mockReturnValue({
        data: mockCommitDetail,
        isLoading: false,
        error: null,
      });
    });

    it('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
      render(<CommitDetailModal {...defaultProps} />);

      const closeButton = screen.getByTestId('close-button');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('背景をクリックするとonCloseが呼ばれる', () => {
      render(<CommitDetailModal {...defaultProps} />);

      const backdrop = screen.getByTestId('modal-backdrop');
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('ESCキーを押すとonCloseが呼ばれる', () => {
      render(<CommitDetailModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('マージコミット', () => {
    const mergeCommit: CanvasCommit = {
      ...mockCommit,
      parentIds: ['parent1', 'parent2'],
    };

    beforeEach(() => {
      mockUseCommitDetail.mockReturnValue({
        data: mockCommitDetail,
        isLoading: false,
        error: null,
      });
    });

    it('マージコミットの場合はMergeタグが表示される', () => {
      render(<CommitDetailModal {...defaultProps} commit={mergeCommit} />);

      expect(screen.getByText('Merge')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    beforeEach(() => {
      mockUseCommitDetail.mockReturnValue({
        data: mockCommitDetail,
        isLoading: false,
        error: null,
      });
    });

    it('モーダルにaria-labelledbyが設定されている', () => {
      render(<CommitDetailModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'commit-detail-title');
    });

    it('モーダルにaria-modal="true"が設定されている', () => {
      render(<CommitDetailModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });
});
