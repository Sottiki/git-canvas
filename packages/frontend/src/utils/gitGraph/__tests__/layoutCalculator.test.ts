/**
 * Git Graph レイアウト計算ロジックのテスト
 */

import type { CanvasCommit } from '@git-canvas/shared/types';
import { describe, expect, it } from 'vitest';
import { calculateGitGraphLayout } from '../layoutCalculator';

describe('calculateGitGraphLayout - Phase 2.1 (単一レーン)', () => {
  /**
   * テストケース1: 空のコミットリスト
   * 何もデータがない場合の挙動を確認
   */
  it('空のコミットリストの場合、空のレイアウトを返す', () => {
    const commits: CanvasCommit[] = [];

    const layout = calculateGitGraphLayout(commits);

    expect(layout.nodes).toHaveLength(0);
    expect(layout.connections).toHaveLength(0);
    expect(layout.lanes).toHaveLength(0);
    expect(layout.viewBox).toEqual({ width: 0, height: 0 });
  });

  /**
   * テストケース2: 単一コミット
   * 最もシンプルなケース（初回コミット）
   */
  it('単一コミットの場合、1つのノードと0個の接続線を返す', () => {
    const commits: CanvasCommit[] = [
      {
        id: 'abc123',
        shortId: 'abc123',
        message: 'Initial commit',
        fullMessage: 'Initial commit',
        date: '2025-01-01T00:00:00Z',
        author: {
          name: 'Test User',
          email: 'test@example.com',
        },
        parentIds: [], // 親なし（初回コミット）
        branchNames: ['main'],
        url: 'https://github.com/owner/repo/commit/abc123',
      },
    ];

    const layout = calculateGitGraphLayout(commits);

    // ノードが1つ生成される
    expect(layout.nodes).toHaveLength(1);
    expect(layout.nodes[0]).toMatchObject({
      id: 'abc123',
      x: 50, // startX
      y: 30, // startY
      lane: 0,
    });

    // 親がないので接続線は0個
    expect(layout.connections).toHaveLength(0);

    // レーンは1つ（lane 0）
    expect(layout.lanes).toHaveLength(1);
    expect(layout.lanes[0]).toEqual({
      laneNumber: 0,
      commitIds: ['abc123'],
    });

    // ビューボックスのサイズ
    expect(layout.viewBox.width).toBeGreaterThan(0);
    expect(layout.viewBox.height).toBeGreaterThan(0);
  });

  /**
   * テストケース3: 2つの連続したコミット
   * 通常のコミット履歴（親子関係あり）
   */
  it('2つの連続したコミットの場合、2つのノードと1つの接続線を返す', () => {
    const commits: CanvasCommit[] = [
      {
        id: 'commit1',
        shortId: 'commit1',
        message: 'First commit',
        fullMessage: 'First commit',
        date: '2025-01-01T00:00:00Z',
        author: { name: 'User', email: 'user@example.com' },
        parentIds: [],
        branchNames: ['main'],
        url: 'https://github.com/owner/repo/commit/commit1',
      },
      {
        id: 'commit2',
        shortId: 'commit2',
        message: 'Second commit',
        fullMessage: 'Second commit',
        date: '2025-01-02T00:00:00Z',
        author: { name: 'User', email: 'user@example.com' },
        parentIds: ['commit1'], // commit1が親
        branchNames: ['main'],
        url: 'https://github.com/owner/repo/commit/commit2',
      },
    ];

    const layout = calculateGitGraphLayout(commits);

    // ノードが2つ
    expect(layout.nodes).toHaveLength(2);

    // commit1が左（x=50）、commit2が右（x=130）
    const node1 = layout.nodes.find((n) => n.id === 'commit1');
    const node2 = layout.nodes.find((n) => n.id === 'commit2');

    expect(node1).toBeDefined();
    expect(node2).toBeDefined();
    expect(node1?.x).toBe(50); // 0 * 80 + 50
    expect(node2?.x).toBe(130); // 1 * 80 + 50

    // 両方ともlane 0（単一レーン）
    expect(node1?.lane).toBe(0);
    expect(node2?.lane).toBe(0);

    // 接続線が1つ（commit2 → commit1）
    expect(layout.connections).toHaveLength(1);
    expect(layout.connections[0]).toMatchObject({
      fromCommitId: 'commit2',
      toCommitId: 'commit1',
      type: 'normal',
    });
  });
});

describe('calculateGitGraphLayout(複数レーン)', () => {
  /**
   * テストケース4: シンプルなブランチ分岐
   * main: commit1 → commit2
   * feature: commit3（commit2から分岐）
   */
  it('ブランチ分岐の場合、異なるレーンに配置される', () => {
    // Arrange
    const commits: CanvasCommit[] = [
      {
        id: 'commit1',
        shortId: 'commit1',
        message: 'Initial commit',
        fullMessage: 'Initial commit',
        date: '2026-01-01T00:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: [],
        branchNames: ['main'],
        url: 'https://example.com',
      },
      {
        id: 'commit2',
        shortId: 'commit2',
        message: 'Main branch commit',
        fullMessage: 'Main branch commit',
        date: '2026-01-01T01:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: ['commit1'],
        branchNames: ['main'],
        url: 'https://example.com',
      },
      {
        id: 'commit3',
        shortId: 'commit3',
        message: 'Test branch commit',
        fullMessage: 'Test branch commit',
        date: '2026-01-01T02:00:00Z',
        author: { name: 'Test', email: 'test@example.com' },
        parentIds: ['commit1'],
        branchNames: ['test-branch'], //  test-branchに変更
        url: 'https://example.com',
      },
    ];

    // Act
    const layout = calculateGitGraphLayout(commits);

    // Assert
    const node1 = layout.nodes.find((n) => n.id === 'commit1');
    const node2 = layout.nodes.find((n) => n.id === 'commit2');
    const node3 = layout.nodes.find((n) => n.id === 'commit3');

    // mainブランチはlane 0
    expect(node1?.lane).toBe(0);
    expect(node2?.lane).toBe(0);

    //  test-branchのみがlane 1
    expect(node3?.lane).toBe(1);

    // レーンが2つ存在する
    expect(layout.lanes).toHaveLength(2);
  });
});

describe('calculateGitGraphLayout(複数レーン + 接続線)', () => {
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
    expect(layout.nodes[0].y).toBe(260); // startY(200) + laneHeight(60)
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
    expect(connection.startY).toBe(260); // test-branch (lane 1)
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
