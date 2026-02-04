import type { CanvasCommit } from '@git-canvas/shared/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommitDetailModal } from '../CommitDetailModal';

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

  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('基本表示', () => {
    it('モーダルがレンダリングされる', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('コミットSHAが表示される', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      const sha = screen.getByTestId('commit-sha');
      expect(sha).toHaveTextContent('abc123def456789full');
    });

    it('完全なコミットメッセージが表示される', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      const message = screen.getByTestId('commit-message');
      expect(message).toHaveTextContent('Add new feature');
      expect(message).toHaveTextContent('This is a detailed description');
      expect(message).toHaveTextContent('with multiple lines.');
    });

    it('作者情報が表示される', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      const author = screen.getByTestId('commit-author');
      expect(author).toHaveTextContent('Test User');
      expect(author).toHaveTextContent('test@example.com');
    });

    it('作者のアバターが表示される', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      const avatar = screen.getByAltText('Test Userのアバター');
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.png');
    });

    it('アバターURLがない場合はアバター画像が表示されない', () => {
      const commitWithoutAvatar: CanvasCommit = {
        ...mockCommit,
        author: { name: 'No Avatar User', email: 'noavatar@example.com' },
      };

      render(<CommitDetailModal commit={commitWithoutAvatar} onClose={mockOnClose} />);

      const avatar = screen.queryByRole('img');
      expect(avatar).not.toBeInTheDocument();
    });

    it('日付がフォーマットされて表示される', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      const date = screen.getByTestId('commit-date');
      // 日本語フォーマットで表示される
      expect(date).toHaveTextContent('2025');
      expect(date).toHaveTextContent('1');
      expect(date).toHaveTextContent('15');
    });

    it('親コミットが表示される', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      const parents = screen.getByTestId('commit-parents');
      expect(parents).toHaveTextContent('parent1'); // 7文字に短縮
    });

    it('ブランチ名が表示される', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      const branches = screen.getByTestId('commit-branches');
      expect(branches).toHaveTextContent('main');
      expect(branches).toHaveTextContent('feature/test');
    });

    it('GitHubリンクが正しいURLで表示される', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      const link = screen.getByTestId('github-link');
      expect(link).toHaveAttribute(
        'href',
        'https://github.com/test/repo/commit/abc123def456789full'
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('ファイル情報のプレースホルダーが表示される', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      const placeholder = screen.getByTestId('files-placeholder');
      expect(placeholder).toBeInTheDocument();
    });
  });

  describe('マージコミット', () => {
    const mergeCommit: CanvasCommit = {
      ...mockCommit,
      parentIds: ['parent1', 'parent2'],
      message: 'Merge branch feature into main',
      fullMessage: 'Merge branch feature into main',
    };

    it('マージコミットの場合はMergeタグが表示される', () => {
      render(<CommitDetailModal commit={mergeCommit} onClose={mockOnClose} />);

      expect(screen.getByText('Merge')).toBeInTheDocument();
    });

    it('複数の親コミットが表示される', () => {
      render(<CommitDetailModal commit={mergeCommit} onClose={mockOnClose} />);

      const parents = screen.getByTestId('commit-parents');
      expect(parents).toHaveTextContent('parent1');
      expect(parents).toHaveTextContent('parent2');
    });
  });

  describe('閉じる操作', () => {
    it('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      const closeButton = screen.getByTestId('close-button');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('背景をクリックするとonCloseが呼ばれる', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      const backdrop = screen.getByTestId('modal-backdrop');
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('モーダル内部をクリックしてもonCloseは呼ばれない', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('ESCキーを押すとonCloseが呼ばれる', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('ESC以外のキーではonCloseは呼ばれない', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('エッジケース', () => {
    it('親コミットがない場合は親コミットセクションが表示されない', () => {
      const commitWithoutParent: CanvasCommit = {
        ...mockCommit,
        parentIds: [],
      };

      render(<CommitDetailModal commit={commitWithoutParent} onClose={mockOnClose} />);

      expect(screen.queryByTestId('commit-parents')).not.toBeInTheDocument();
    });

    it('ブランチがない場合はブランチセクションが表示されない', () => {
      const commitWithoutBranch: CanvasCommit = {
        ...mockCommit,
        branchNames: [],
      };

      render(<CommitDetailModal commit={commitWithoutBranch} onClose={mockOnClose} />);

      expect(screen.queryByTestId('commit-branches')).not.toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('モーダルにaria-labelledbyが設定されている', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'commit-detail-title');
    });

    it('モーダルにaria-modal="true"が設定されている', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('閉じるボタンにaria-labelが設定されている', () => {
      render(<CommitDetailModal commit={mockCommit} onClose={mockOnClose} />);

      const closeButton = screen.getByTestId('close-button');
      expect(closeButton).toHaveAttribute('aria-label', '閉じる');
    });
  });
});
