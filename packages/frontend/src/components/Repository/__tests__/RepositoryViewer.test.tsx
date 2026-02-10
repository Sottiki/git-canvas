import type { CanvasRepository } from '@git-canvas/shared/types';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as useRepositoryHook from '../../../hooks/useRepository';
import { RepositoryViewer } from '../RepositoryViewer';

// useRepository フックをモック化
vi.mock('../../../hooks/useRepository');

// useCommitDetail フックをモック化
vi.mock('../../../hooks/useCommitDetail', () => ({
  useCommitDetail: vi.fn().mockReturnValue({
    data: {
      sha: 'abc123',
      files: [
        {
          filename: 'test.ts',
          status: 'modified',
          additions: 10,
          deletions: 5,
          changes: 15,
        },
      ],
      stats: { total: 15, additions: 10, deletions: 5 },
    },
    isLoading: false,
    error: null,
  }),
}));

describe('RepositoryViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング中は "Loading..." を表示する', () => {
    // Arrange
    vi.spyOn(useRepositoryHook, 'useRepository').mockReturnValue({
      repository: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    render(<RepositoryViewer owner="Sottiki" repo="git-canvas" />);

    // Assert
    expect(screen.getByText('Loading repository data...')).toBeInTheDocument();
  });

  it('エラー時はエラーメッセージと Retry ボタンを表示する', () => {
    // Arrange
    const mockRefetch = vi.fn();
    vi.spyOn(useRepositoryHook, 'useRepository').mockReturnValue({
      repository: null,
      loading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    });

    // Act
    render(<RepositoryViewer owner="Sottiki" repo="git-canvas" />);

    // Assert
    expect(screen.getByText('Error loading repository')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('Retry ボタンをクリックすると refetch が呼ばれる', async () => {
    // Arrange
    const mockRefetch = vi.fn();
    vi.spyOn(useRepositoryHook, 'useRepository').mockReturnValue({
      repository: null,
      loading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    });

    // Act
    render(<RepositoryViewer owner="Sottiki" repo="git-canvas" />);

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    retryButton.click();

    // Assert
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('データがない場合は "No repository data" を表示する', () => {
    // Arrange
    vi.spyOn(useRepositoryHook, 'useRepository').mockReturnValue({
      repository: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    render(<RepositoryViewer owner="Sottiki" repo="git-canvas" />);

    // Assert
    expect(screen.getByText('No repository data available')).toBeInTheDocument();
  });

  it('リポジトリ情報を正しく表示する', () => {
    // Arrange
    const mockRepository: CanvasRepository = {
      owner: 'Sottiki',
      name: 'git-canvas',
      commits: [
        {
          id: 'abc123',
          shortId: 'abc123d',
          message: 'Test commit',
          fullMessage: 'Test commit\n\nDetails',
          date: '2025-01-01T12:00:00Z',
          author: {
            name: 'Test User',
            email: 'test@example.com',
            avatarUrl: 'https://example.com/avatar.jpg',
          },
          parentIds: [],
          branchNames: [],
          url: 'https://github.com/Sottiki/git-canvas/commit/abc123',
        },
      ],
      branches: [
        {
          name: 'main',
          latestCommitId: 'abc123',
          isProtected: true,
        },
        {
          name: 'develop',
          latestCommitId: 'def456',
          isProtected: false,
        },
      ],
    };

    vi.spyOn(useRepositoryHook, 'useRepository').mockReturnValue({
      repository: mockRepository,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    render(<RepositoryViewer owner="Sottiki" repo="git-canvas" />);

    // Assert - リポジトリ名
    expect(screen.getByText('Sottiki / git-canvas')).toBeInTheDocument();

    // Assert - ブランチ数
    expect(screen.getByText('Branches')).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
    const branchesSection = screen.getByRole('heading', { name: /Branches/ }).closest('section');
    expect(within(branchesSection!).getByText(/main/)).toBeInTheDocument();
    expect(within(branchesSection!).getByText(/develop/)).toBeInTheDocument();

    // Assert - コミット数
    expect(screen.getByText('Branches')).toBeInTheDocument();
    expect(screen.getByText('(1)')).toBeInTheDocument();
    expect(screen.getByText('Test commit')).toBeInTheDocument();
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
    expect(screen.getAllByText(/abc123d/).length).toBeGreaterThan(0);

    // Assert - アバター画像
    const avatar = screen.getByAltText('Test User');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');

    // Assert - Refresh ボタン
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });

  it('保護されたブランチには 🔒 アイコンが表示される', () => {
    // Arrange
    const mockRepository: CanvasRepository = {
      owner: 'Sottiki',
      name: 'git-canvas',
      commits: [],
      branches: [
        {
          name: 'main',
          latestCommitId: 'abc123',
          isProtected: true,
        },
      ],
    };

    vi.spyOn(useRepositoryHook, 'useRepository').mockReturnValue({
      repository: mockRepository,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    render(<RepositoryViewer owner="Sottiki" repo="git-canvas" />);

    // Assert - Branchesセクション内で検証
    const branchesSection = screen.getByRole('heading', { name: /Branches/ }).closest('section');
    expect(within(branchesSection!).getByText('main')).toBeInTheDocument();
    expect(within(branchesSection!).getByText('🔒')).toBeInTheDocument();
  });

  it('Refresh ボタンをクリックすると refetch が呼ばれる', () => {
    // Arrange
    const mockRefetch = vi.fn();
    const mockRepository: CanvasRepository = {
      owner: 'Sottiki',
      name: 'git-canvas',
      commits: [],
      branches: [],
    };

    vi.spyOn(useRepositoryHook, 'useRepository').mockReturnValue({
      repository: mockRepository,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    // Act
    render(<RepositoryViewer owner="Sottiki" repo="git-canvas" />);

    const refreshButton = screen.getByRole('button', { name: 'Refresh' });
    refreshButton.click();

    // Assert
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});

describe('RepositoryViewer - コミット詳細モーダル', () => {
  const mockRepository: CanvasRepository = {
    owner: 'Sottiki',
    name: 'git-canvas',
    commits: [
      {
        id: 'abc123full',
        shortId: 'abc123d',
        message: 'Test commit',
        fullMessage: 'Test commit\n\nDetailed description',
        date: '2025-01-01T12:00:00Z',
        author: {
          name: 'Test User',
          email: 'test@example.com',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        parentIds: [],
        branchNames: ['main'],
        url: 'https://github.com/Sottiki/git-canvas/commit/abc123full',
      },
    ],
    branches: [
      {
        name: 'main',
        latestCommitId: 'abc123full',
        isProtected: false,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useRepositoryHook, 'useRepository').mockReturnValue({
      repository: mockRepository,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('初期状態ではモーダルが表示されない', () => {
    // Act
    render(<RepositoryViewer owner="Sottiki" repo="git-canvas" />);

    // Assert
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('コミットノードをクリックするとモーダルが表示される', () => {
    // Arrange
    render(<RepositoryViewer owner="Sottiki" repo="git-canvas" />);

    // Act - コミットノードをクリック
    const commitNode = screen.getByTestId('commit-node-abc123d');
    fireEvent.click(commitNode);

    // Assert - モーダルが表示される
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('コミット詳細')).toBeInTheDocument();
  });

  it('モーダルにコミット情報が表示される', () => {
    // Arrange
    render(<RepositoryViewer owner="Sottiki" repo="git-canvas" />);

    // Act
    const commitNode = screen.getByTestId('commit-node-abc123d');
    fireEvent.click(commitNode);

    // Assert
    expect(screen.getByTestId('commit-sha')).toHaveTextContent('abc123full');
    expect(screen.getByTestId('commit-message')).toHaveTextContent('Test commit');
    expect(screen.getByTestId('commit-author')).toHaveTextContent('Test User');
  });

  it('モーダルの閉じるボタンをクリックするとモーダルが閉じる', () => {
    // Arrange
    render(<RepositoryViewer owner="Sottiki" repo="git-canvas" />);

    // モーダルを開く
    const commitNode = screen.getByTestId('commit-node-abc123d');
    fireEvent.click(commitNode);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Act - 閉じるボタンをクリック
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);

    // Assert - モーダルが閉じる
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('モーダルの背景をクリックするとモーダルが閉じる', () => {
    // Arrange
    render(<RepositoryViewer owner="Sottiki" repo="git-canvas" />);

    // モーダルを開く
    const commitNode = screen.getByTestId('commit-node-abc123d');
    fireEvent.click(commitNode);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Act - 背景をクリック
    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);

    // Assert - モーダルが閉じる
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ESCキーを押すとモーダルが閉じる', () => {
    // Arrange
    render(<RepositoryViewer owner="Sottiki" repo="git-canvas" />);

    // モーダルを開く
    const commitNode = screen.getByTestId('commit-node-abc123d');
    fireEvent.click(commitNode);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Act - ESCキーを押す
    fireEvent.keyDown(document, { key: 'Escape' });

    // Assert - モーダルが閉じる
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('別のコミットをクリックするとモーダルの内容が更新される', () => {
    // Arrange - 2つのコミットを持つリポジトリ
    const repositoryWithTwoCommits: CanvasRepository = {
      ...mockRepository,
      commits: [
        mockRepository.commits[0],
        {
          id: 'def456full',
          shortId: 'def456d',
          message: 'Second commit',
          fullMessage: 'Second commit message',
          date: '2025-01-02T12:00:00Z',
          author: {
            name: 'Another User',
            email: 'another@example.com',
          },
          parentIds: ['abc123full'],
          branchNames: ['main'],
          url: 'https://github.com/Sottiki/git-canvas/commit/def456full',
        },
      ],
    };

    vi.spyOn(useRepositoryHook, 'useRepository').mockReturnValue({
      repository: repositoryWithTwoCommits,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<RepositoryViewer owner="Sottiki" repo="git-canvas" />);

    // Act - 最初のコミットをクリック
    const firstNode = screen.getByTestId('commit-node-abc123d');
    fireEvent.click(firstNode);

    // Assert - 最初のコミット情報が表示される
    expect(screen.getByTestId('commit-sha')).toHaveTextContent('abc123full');

    // Act - モーダルを閉じて2番目のコミットをクリック
    fireEvent.keyDown(document, { key: 'Escape' });
    const secondNode = screen.getByTestId('commit-node-def456d');
    fireEvent.click(secondNode);

    // Assert - 2番目のコミット情報が表示される
    expect(screen.getByTestId('commit-sha')).toHaveTextContent('def456full');
    expect(screen.getByTestId('commit-message')).toHaveTextContent('Second commit message');
  });
});
