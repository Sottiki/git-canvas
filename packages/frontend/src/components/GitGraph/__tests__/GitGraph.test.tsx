import type { CanvasBranch, CanvasCommit } from '@git-canvas/shared/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GitGraph } from '../GitGraph';

describe('GitGraph', () => {
  const mockCommits: CanvasCommit[] = [
    {
      id: 'abc123',
      shortId: 'abc123d',
      message: 'First commit',
      fullMessage: 'First commit',
      date: '2025-01-01T12:00:00Z',
      author: {
        name: 'Test User',
        email: 'test@example.com',
        avatarUrl: undefined,
      },
      parentIds: [],
      branchNames: ['main'],
      url: 'https://github.com/test/repo/commit/abc123',
    },
    {
      id: 'def456',
      shortId: 'def456e',
      message: 'Second commit',
      fullMessage: 'Second commit',
      date: '2025-01-02T12:00:00Z',
      author: {
        name: 'Test User',
        email: 'test@example.com',
        avatarUrl: undefined,
      },
      parentIds: ['abc123'],
      branchNames: ['main'],
      url: 'https://github.com/test/repo/commit/def456',
    },
  ];

  it('コミットグラフをレンダリングする', () => {
    render(<GitGraph commits={mockCommits} />);

    const svg = screen.getByRole('img', { name: 'Git commit graph' });
    expect(svg).toBeInTheDocument();
  });

  it('全てのコミットSHAを表示する', () => {
    render(<GitGraph commits={mockCommits} />);

    expect(screen.getByText('abc123d')).toBeInTheDocument();
    expect(screen.getByText('def456e')).toBeInTheDocument();
  });

  it('コミットが0個の場合もエラーなくレンダリングする', () => {
    render(<GitGraph commits={[]} />);

    const svg = screen.getByRole('img', { name: 'Git commit graph' });
    expect(svg).toBeInTheDocument();
  });

  it('branchesを渡さなくてもエラーにならない（後方互換性）', () => {
    // branches未指定でも動作する
    render(<GitGraph commits={mockCommits} />);

    const svg = screen.getByRole('img', { name: 'Git commit graph' });
    expect(svg).toBeInTheDocument();
  });

  it('branchesを渡すとレーンラベルが表示される', () => {
    const mockBranches: CanvasBranch[] = [
      {
        name: 'main',
        latestCommitId: 'def456',
        isProtected: true,
      },
    ];

    render(<GitGraph commits={mockCommits} branches={mockBranches} />);

    // 左袖にブランチ名が表示される
    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('複数のブランチ名が表示される', () => {
    const mockCommitsWithBranches: CanvasCommit[] = [
      {
        id: 'main1',
        shortId: 'main1ab',
        message: 'Main commit',
        fullMessage: 'Main commit',
        date: '2025-01-01T12:00:00Z',
        author: {
          name: 'Test User',
          email: 'test@example.com',
        },
        parentIds: [],
        branchNames: ['main'],
        url: 'https://github.com/test/repo/commit/main1',
      },
      {
        id: 'feature1',
        shortId: 'feat1cd',
        message: 'Feature commit',
        fullMessage: 'Feature commit',
        date: '2025-01-02T12:00:00Z',
        author: {
          name: 'Test User',
          email: 'test@example.com',
        },
        parentIds: ['main1'],
        branchNames: ['feature/test'],
        url: 'https://github.com/test/repo/commit/feature1',
      },
    ];

    const mockBranches: CanvasBranch[] = [
      {
        name: 'main',
        latestCommitId: 'main1',
        isProtected: true,
      },
      {
        name: 'feature/test',
        latestCommitId: 'feature1',
        isProtected: false,
      },
    ];

    render(<GitGraph commits={mockCommitsWithBranches} branches={mockBranches} />);

    // 両方のブランチ名が表示される
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('feature/test')).toBeInTheDocument();
  });
});

describe('GitGraph - onCommitClick', () => {
  const mockCommit: CanvasCommit = {
    id: 'abc123full',
    shortId: 'abc123d',
    message: 'Test commit',
    fullMessage: 'Test commit\n\nDetailed description here',
    date: '2025-01-01T12:00:00Z',
    author: {
      name: 'Test User',
      email: 'test@example.com',
      avatarUrl: 'https://example.com/avatar.png',
    },
    parentIds: [],
    branchNames: ['main'],
    url: 'https://github.com/test/repo/commit/abc123full',
  };

  const mockCommits: CanvasCommit[] = [mockCommit];

  it('onCommitClickを渡さなくてもエラーにならない（後方互換性）', () => {
    // Arrange & Act
    render(<GitGraph commits={mockCommits} />);

    // Assert
    const svg = screen.getByRole('img', { name: 'Git commit graph' });
    expect(svg).toBeInTheDocument();
  });

  it('onCommitClickがundefinedでもクリック時にエラーにならない', () => {
    // Arrange
    render(<GitGraph commits={mockCommits} onCommitClick={undefined} />);

    // Act - ノードをクリック
    const node = screen.getByTestId('commit-node-abc123d');
    fireEvent.click(node);

    // Assert - エラーが発生しないことを確認
    const svg = screen.getByRole('img', { name: 'Git commit graph' });
    expect(svg).toBeInTheDocument();
  });

  it('コミットノードをクリックするとonCommitClickが呼ばれる', () => {
    // Arrange
    const handleCommitClick = vi.fn();
    render(<GitGraph commits={mockCommits} onCommitClick={handleCommitClick} />);

    // Act
    const node = screen.getByTestId('commit-node-abc123d');
    fireEvent.click(node);

    // Assert
    expect(handleCommitClick).toHaveBeenCalledTimes(1);
    expect(handleCommitClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'abc123full',
        shortId: 'abc123d',
        message: 'Test commit',
      })
    );
  });

  it('マージコミットノードをクリックするとonCommitClickが呼ばれる', () => {
    // Arrange - マージコミット（2つ以上の親を持つ）
    const mergeCommit: CanvasCommit = {
      id: 'merge123',
      shortId: 'merge12',
      message: 'Merge branch feature into main',
      fullMessage: 'Merge branch feature into main',
      date: '2025-01-03T12:00:00Z',
      author: {
        name: 'Test User',
        email: 'test@example.com',
      },
      parentIds: ['abc123', 'def456'], // 2つの親 = マージコミット
      branchNames: ['main'],
      url: 'https://github.com/test/repo/commit/merge123',
    };

    const commitsWithMerge: CanvasCommit[] = [
      mockCommit,
      {
        id: 'def456',
        shortId: 'def456e',
        message: 'Feature commit',
        fullMessage: 'Feature commit',
        date: '2025-01-02T12:00:00Z',
        author: { name: 'Test User', email: 'test@example.com' },
        parentIds: ['abc123full'],
        branchNames: ['feature'],
        url: 'https://github.com/test/repo/commit/def456',
      },
      mergeCommit,
    ];

    const handleCommitClick = vi.fn();
    render(<GitGraph commits={commitsWithMerge} onCommitClick={handleCommitClick} />);

    // Act - マージノードをクリック
    const mergeNode = screen.getByTestId('commit-node-merge12');
    fireEvent.click(mergeNode);

    // Assert
    expect(handleCommitClick).toHaveBeenCalledTimes(1);
    expect(handleCommitClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'merge123',
        shortId: 'merge12',
        parentIds: ['abc123', 'def456'],
      })
    );
  });

  it('複数のコミットノードをそれぞれクリックできる', () => {
    // Arrange
    const twoCommits: CanvasCommit[] = [
      mockCommit,
      {
        id: 'second456',
        shortId: 'second4',
        message: 'Second commit',
        fullMessage: 'Second commit',
        date: '2025-01-02T12:00:00Z',
        author: { name: 'Test User', email: 'test@example.com' },
        parentIds: ['abc123full'],
        branchNames: ['main'],
        url: 'https://github.com/test/repo/commit/second456',
      },
    ];

    const handleCommitClick = vi.fn();
    render(<GitGraph commits={twoCommits} onCommitClick={handleCommitClick} />);

    // Act - 両方のノードをクリック
    const firstNode = screen.getByTestId('commit-node-abc123d');
    const secondNode = screen.getByTestId('commit-node-second4');

    fireEvent.click(firstNode);
    fireEvent.click(secondNode);

    // Assert
    expect(handleCommitClick).toHaveBeenCalledTimes(2);
    expect(handleCommitClick).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ shortId: 'abc123d' })
    );
    expect(handleCommitClick).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ shortId: 'second4' })
    );
  });
});
