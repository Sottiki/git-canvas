/**
 * Git Graph レイアウト計算ロジックのテスト
 * Phase 2.1: 単一レーン（Phase 1の再現）
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
