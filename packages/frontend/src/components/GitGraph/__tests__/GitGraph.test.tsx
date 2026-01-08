import type { CanvasCommit } from '@git-canvas/shared/types';
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
});
