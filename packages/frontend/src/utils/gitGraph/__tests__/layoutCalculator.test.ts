import type { CanvasCommit } from '@git-canvas/shared/types';
import { describe, expect, it } from 'vitest';
import { calculateGitGraphLayout } from '../layoutCalculator';

describe('calculateGitGraphLayout - (複数レーン + 接続線)', () => {
  // テスト用の共通設定
  const testConfig = {
    nodeSpacing: 80,
    laneHeight: 60,
    startX: 50,
    startY: 200,
    nodeRadius: 8,
  };

  it('test-branchのみのコミットがlane 1に配置される', () => {
    // Arrange: test-branchのみのコミット
    const commits: CanvasCommit[] = [
      {
        id: 'commit1',
        shortId: 'commit1',
        message: 'Test commit',
        fullMessage: 'Test commit',
        date: '2026-01-01T00:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: [],
        branchNames: ['test-branch'],
        url: 'https://example.com',
      },
    ];

    // Act
    const layout = calculateGitGraphLayout(commits, testConfig);

    // Assert
    expect(layout.nodes).toHaveLength(1);
    expect(layout.nodes[0].lane).toBe(1);
    // Y座標 = startY(200) + laneHeight(60) × lane(1) + mountainHeight(40)
    expect(layout.nodes[0].y).toBe(300);
  });

  it('mainを含むコミットはlane 0に配置される', () => {
    // Arrange
    const commits: CanvasCommit[] = [
      {
        id: 'commit1',
        shortId: 'commit1',
        message: 'Main commit',
        fullMessage: 'Main commit',
        date: '2026-01-01T00:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: [],
        branchNames: ['main'],
        url: 'https://example.com',
      },
    ];

    // Act
    const layout = calculateGitGraphLayout(commits, testConfig);

    // Assert
    expect(layout.nodes[0].lane).toBe(0);
    expect(layout.nodes[0].y).toBe(200);
  });

  it('mainとtest-branchを含むコミットはlane 0に配置される', () => {
    // Arrange
    const commits: CanvasCommit[] = [
      {
        id: 'commit1',
        shortId: 'commit1',
        message: 'Merge point',
        fullMessage: 'Merge point',
        date: '2026-01-01T00:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: [],
        branchNames: ['main', 'test-branch', 'feature/multi-branch-layout'],
        url: 'https://example.com',
      },
    ];

    // Act
    const layout = calculateGitGraphLayout(commits, testConfig);

    // Assert
    expect(layout.nodes[0].lane).toBe(0);
  });

  it('親子関係のあるコミット間に接続線が生成される', () => {
    // Arrange: 親子関係のある2つのコミット
    const commits: CanvasCommit[] = [
      {
        id: 'parent',
        shortId: 'parent',
        message: 'Parent',
        fullMessage: 'Parent',
        date: '2026-01-01T00:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: [],
        branchNames: ['main'],
        url: 'https://example.com',
      },
      {
        id: 'child',
        shortId: 'child',
        message: 'Child',
        fullMessage: 'Child',
        date: '2026-01-01T01:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: ['parent'],
        branchNames: ['main'],
        url: 'https://example.com',
      },
    ];

    // Act
    const layout = calculateGitGraphLayout(commits, testConfig);

    // Assert
    expect(layout.connections).toHaveLength(1);
    expect(layout.connections[0].fromCommitId).toBe('child');
    expect(layout.connections[0].toCommitId).toBe('parent');
    expect(layout.connections[0].type).toBe('normal');
  });

  it('異なるレーン間の接続線が正しい座標を持つ', () => {
    // Arrange: mainブランチとtest-branchの分岐
    const commits: CanvasCommit[] = [
      {
        id: 'main1',
        shortId: 'main1',
        message: 'Main',
        fullMessage: 'Main',
        date: '2026-01-01T00:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: [],
        branchNames: ['main', 'test-branch'],
        url: 'https://example.com',
      },
      {
        id: 'test1',
        shortId: 'test1',
        message: 'Test branch',
        fullMessage: 'Test branch',
        date: '2026-01-01T01:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: ['main1'],
        branchNames: ['test-branch'],
        url: 'https://example.com',
      },
    ];

    // Act
    const layout = calculateGitGraphLayout(commits, testConfig);

    // Assert
    const connection = layout.connections[0];
    // test-branch (lane 1) + mountainHeight(40) = 200 + 60 + 40 = 300
    expect(connection.startY).toBe(300);
    expect(connection.endY).toBe(200); // main (lane 0)
  });

  it('レーン情報が正しく生成される', () => {
    // Arrange
    const commits: CanvasCommit[] = [
      {
        id: 'main1',
        shortId: 'main1',
        message: 'Main',
        fullMessage: 'Main',
        date: '2026-01-01T00:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: [],
        branchNames: ['main'],
        url: 'https://example.com',
      },
      {
        id: 'test1',
        shortId: 'test1',
        message: 'Test',
        fullMessage: 'Test',
        date: '2026-01-01T01:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: [],
        branchNames: ['test-branch'],
        url: 'https://example.com',
      },
    ];

    // Act
    const layout = calculateGitGraphLayout(commits, testConfig);

    // Assert
    expect(layout.lanes).toHaveLength(2);
    expect(layout.lanes[0].laneNumber).toBe(0);
    expect(layout.lanes[1].laneNumber).toBe(1);
    expect(layout.lanes[0].commitIds).toContain('main1');
    expect(layout.lanes[1].commitIds).toContain('test1');
  });
});

describe('calculateGitGraphLayout - (マージコミット対応)', () => {
  // テスト用の共通設定
  const testConfig = {
    nodeSpacing: 80,
    laneHeight: 60,
    startX: 50,
    startY: 200,
    nodeRadius: 8,
  };

  it('親が2つ以上のコミットをマージコミットとして検出する', () => {
    // Arrange: マージコミット（親が2つ）
    const commits: CanvasCommit[] = [
      {
        id: 'parent1',
        shortId: 'parent1',
        message: 'Parent 1',
        fullMessage: 'Parent 1',
        date: '2026-01-01T00:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: [],
        branchNames: ['main'],
        url: 'https://example.com',
      },
      {
        id: 'parent2',
        shortId: 'parent2',
        message: 'Parent 2',
        fullMessage: 'Parent 2',
        date: '2026-01-01T01:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: [],
        branchNames: ['test-branch'],
        url: 'https://example.com',
      },
      {
        id: 'merge',
        shortId: 'merge',
        message: 'Merge branch',
        fullMessage: 'Merge branch',
        date: '2026-01-01T02:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: ['parent1', 'parent2'], // 2つの親
        branchNames: ['main'],
        url: 'https://example.com',
      },
    ];

    // Act
    const layout = calculateGitGraphLayout(commits, testConfig);

    // Assert: マージコミットからの接続線はtype='merge'
    const mergeConnections = layout.connections.filter((c) => c.type === 'merge');
    expect(mergeConnections).toHaveLength(2); // 2つの親への接続

    expect(mergeConnections[0].fromCommitId).toBe('merge');
    expect(mergeConnections[0].toCommitId).toBe('parent1');

    expect(mergeConnections[1].fromCommitId).toBe('merge');
    expect(mergeConnections[1].toCommitId).toBe('parent2');
  });

  it('通常のコミット（親が1つ）はtype="normal"', () => {
    // Arrange: 通常のコミット
    const commits: CanvasCommit[] = [
      {
        id: 'parent',
        shortId: 'parent',
        message: 'Parent',
        fullMessage: 'Parent',
        date: '2026-01-01T00:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: [],
        branchNames: ['main'],
        url: 'https://example.com',
      },
      {
        id: 'child',
        shortId: 'child',
        message: 'Child',
        fullMessage: 'Child',
        date: '2026-01-01T01:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: ['parent'], // 親が1つ
        branchNames: ['main'],
        url: 'https://example.com',
      },
    ];

    // Act
    const layout = calculateGitGraphLayout(commits, testConfig);

    // Assert: 通常のコミットはtype='normal'
    expect(layout.connections).toHaveLength(1);
    expect(layout.connections[0].type).toBe('normal');
    expect(layout.connections[0].fromCommitId).toBe('child');
    expect(layout.connections[0].toCommitId).toBe('parent');
  });

  it('親が0個のコミット（初回コミット）は接続線を生成しない', () => {
    // Arrange: 初回コミット
    const commits: CanvasCommit[] = [
      {
        id: 'first',
        shortId: 'first',
        message: 'First commit',
        fullMessage: 'First commit',
        date: '2026-01-01T00:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: [], // 親なし
        branchNames: ['main'],
        url: 'https://example.com',
      },
    ];

    // Act
    const layout = calculateGitGraphLayout(commits, testConfig);

    // Assert: 接続線なし
    expect(layout.connections).toHaveLength(0);
  });

  it('マージコミットと通常コミットが混在する場合', () => {
    // Arrange: マージコミットと通常コミットの混在
    const commits: CanvasCommit[] = [
      {
        id: 'base',
        shortId: 'base',
        message: 'Base',
        fullMessage: 'Base',
        date: '2026-01-01T00:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: [],
        branchNames: ['main'],
        url: 'https://example.com',
      },
      {
        id: 'feature',
        shortId: 'feature',
        message: 'Feature',
        fullMessage: 'Feature',
        date: '2026-01-01T01:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: ['base'],
        branchNames: ['test-branch'],
        url: 'https://example.com',
      },
      {
        id: 'merge',
        shortId: 'merge',
        message: 'Merge',
        fullMessage: 'Merge',
        date: '2026-01-01T02:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: ['base', 'feature'],
        branchNames: ['main'],
        url: 'https://example.com',
      },
      {
        id: 'after',
        shortId: 'after',
        message: 'After merge',
        fullMessage: 'After merge',
        date: '2026-01-01T03:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: ['merge'],
        branchNames: ['main'],
        url: 'https://example.com',
      },
    ];

    // Act
    const layout = calculateGitGraphLayout(commits, testConfig);

    // Assert
    expect(layout.connections).toHaveLength(4);

    const normalConnections = layout.connections.filter((c) => c.type === 'normal');
    const mergeConnections = layout.connections.filter((c) => c.type === 'merge');

    expect(normalConnections).toHaveLength(2); // feature->base, after->merge
    expect(mergeConnections).toHaveLength(2); // merge->base, merge->feature
  });
});
