/**
 * Git Graph レイアウト計算ロジック
 * Phase 2: 複数ブランチ対応
 *
 * このモジュールは、CanvasCommitの配列を受け取り、
 * SVG描画用の座標情報を計算してGitGraphLayoutを生成します。
 */

import type {
  BranchLane,
  CanvasCommit,
  CommitConnection,
  CommitNode,
  GitGraphLayout,
  LayoutConfig,
} from '@git-canvas/shared/types';

/**
 * デフォルトのレイアウト設定
 * Phase 1の実装値を踏襲
 */
const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  nodeSpacing: 80, // ノード間の水平距離
  laneHeight: 60, // レーン間の垂直距離
  startX: 50, // 開始X座標
  startY: 30, // 開始Y座標
  nodeRadius: 8, // ノードの半径
};

/**
 * コミット履歴からGitGraphのレイアウトを計算
 *
 * @param commits - コミットリスト（順不同でも可）
 * @param config - レイアウト設定（オプショナル）
 * @returns レイアウト計算済みのGitGraphLayout
 *
 * @example
 * ```typescript
 * const commits: CanvasCommit[] = [...];
 * const layout = calculateGitGraphLayout(commits);
 * // layoutをGitGraphコンポーネントに渡す
 * ```
 */
export function calculateGitGraphLayout(
  commits: CanvasCommit[],
  config: Partial<LayoutConfig> = {}
): GitGraphLayout {
  // 設定のマージ（デフォルト値 + ユーザー指定値）
  const layoutConfig: LayoutConfig = {
    ...DEFAULT_LAYOUT_CONFIG,
    ...config,
  };

  // コミットが空の場合は空のレイアウトを返す
  if (commits.length === 0) {
    return {
      nodes: [],
      connections: [],
      lanes: [],
      viewBox: { width: 0, height: 0 },
    };
  }

  // Step 1: コミットを時系列でソート（古い順）
  const sortedCommits = sortCommitsByDate(commits);

  // Step 2: レーン割り当て（シンプル版：Phase 2.1）
  const laneAssignments = assignLanes(sortedCommits);

  // Step 3: ノードの座標計算
  const nodes = calculateNodePositions(sortedCommits, laneAssignments, layoutConfig);

  // Step 4: 接続線の生成
  const connections = generateConnections(nodes);

  // Step 5: ブランチレーン情報の生成
  const lanes = generateBranchLanes(nodes);

  // Step 6: SVGビューボックスのサイズ計算
  const viewBox = calculateViewBox(nodes, layoutConfig);

  return {
    nodes,
    connections,
    lanes,
    viewBox,
  };
}

/**
 * コミットを日付順（古い順）にソート
 *
 * Gitグラフは時系列で左から右に描画するため、
 * 古いコミットが配列の先頭になるようソートします。
 */
function sortCommitsByDate(commits: CanvasCommit[]): CanvasCommit[] {
  return [...commits].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

/**
 * 各コミットにレーン番号を割り当て
 *
 * Phase 2.2: ブランチ名に基づくレーン割り当て
 * - test-branchのみ → lane 1
 * - それ以外（mainを含む） → lane 0
 *
 * TODO Phase 2.3: 複数のfeatureブランチを異なるレーンに配置
 */
function assignLanes(commits: CanvasCommit[]): Map<string, number> {
  const laneMap = new Map<string, number>();

  for (const commit of commits) {
    // test-branchのみに属するコミット → lane 1
    const isTestBranchOnly =
      commit.branchNames.includes('test-branch') && commit.branchNames.length === 1;

    if (isTestBranchOnly) {
      laneMap.set(commit.id, 1);
    } else {
      // それ以外はすべてlane 0
      laneMap.set(commit.id, 0);
    }
  }

  return laneMap;
}

/**
 * ノードの座標を計算
 *
 * X座標: コミットのインデックス × nodeSpacing + startX
 * Y座標: レーン番号 × laneHeight + startY
 */
function calculateNodePositions(
  commits: CanvasCommit[],
  laneAssignments: Map<string, number>,
  config: LayoutConfig
): CommitNode[] {
  return commits.map((commit, index) => {
    const lane = laneAssignments.get(commit.id) ?? 0;
    const x = index * config.nodeSpacing + config.startX;
    const y = lane * config.laneHeight + config.startY;

    return {
      ...commit,
      x,
      y,
      lane,
    };
  });
}

/**
 * コミット間の接続線を生成
 *
 * 各コミットから親コミットへの線を作成します。
 * Phase 2.4: マージコミット（親が2つ以上）の場合はtype='merge'を設定
 * 親が存在しない場合（初回コミット）は線を作成しません。
 */
function generateConnections(nodes: CommitNode[]): CommitConnection[] {
  const connections: CommitConnection[] = [];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  for (const node of nodes) {
    // Phase 2.4: マージコミット判定
    const isMergeCommit = node.parentIds.length >= 2;

    // 各親コミットへの接続を作成
    for (const parentId of node.parentIds) {
      const parentNode = nodeMap.get(parentId);

      if (!parentNode) {
        // 親が見つからない場合はスキップ（リポジトリの初回コミットなど）
        continue;
      }

      // 接続線を作成
      connections.push({
        fromCommitId: node.id,
        toCommitId: parentId,
        startX: node.x,
        startY: node.y,
        endX: parentNode.x,
        endY: parentNode.y,
        // Phase 2.4: マージコミットからの接続はtype='merge'
        type: isMergeCommit ? 'merge' : 'normal',
      });
    }
  }

  return connections;
}

/**
 * ブランチレーン情報を生成
 *
 * 各レーンに属するコミットIDをグループ化します。
 */
function generateBranchLanes(nodes: CommitNode[]): BranchLane[] {
  const laneMap = new Map<number, string[]>();

  // レーンごとにコミットIDをグループ化
  for (const node of nodes) {
    const commitIds = laneMap.get(node.lane) ?? [];
    commitIds.push(node.id);
    laneMap.set(node.lane, commitIds);
  }

  // BranchLane配列に変換
  return Array.from(laneMap.entries()).map(([laneNumber, commitIds]) => ({
    laneNumber,
    commitIds,
  }));
}

/**
 * SVGビューボックスのサイズを計算
 *
 * すべてのノードが収まるように、幅と高さを計算します。
 */
function calculateViewBox(
  nodes: CommitNode[],
  config: LayoutConfig
): { width: number; height: number } {
  if (nodes.length === 0) {
    return { width: 0, height: 0 };
  }

  // 最大X座標を取得
  const maxX = Math.max(...nodes.map((node) => node.x));
  // 最大レーン番号を取得
  const maxLane = Math.max(...nodes.map((node) => node.lane));

  // 幅: 最大X座標 + 余白
  const width = maxX + config.nodeSpacing;
  // 高さ: 最大レーン × レーン高さ + 余白
  const height = (maxLane + 1) * config.laneHeight + config.startY * 2;

  return { width, height };
}
