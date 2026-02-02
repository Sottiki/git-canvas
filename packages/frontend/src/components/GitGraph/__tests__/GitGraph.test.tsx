import type { CanvasBranch, CanvasCommit } from '@git-canvas/shared/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
