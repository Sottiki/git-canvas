/**
 * Git Graph レイアウト計算ロジック
 *
 * CanvasCommitの配列を受け取り、SVG描画用の座標情報を計算してGitGraphLayoutを生成する
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

  const sortedCommits = sortCommitsByDate(commits);

  const laneAssignments = assignLanes(sortedCommits);

  const nodes = calculateNodePositions(sortedCommits, laneAssignments, layoutConfig);

  const connections = generateConnections(nodes);

  const lanes = generateBranchLanes(nodes);

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
 */
function sortCommitsByDate(commits: CanvasCommit[]): CanvasCommit[] {
  return [...commits].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

/**
 * 各コミットにレーン番号を割り当て
 */
function assignLanes(commits: CanvasCommit[]): Map<string, number> {
  const laneMap = new Map<string, number>();

  for (const commit of commits) {
    // branchNamesを確認してレーンを決定
    const isMainBranch = commit.branchNames.includes('main');

    if (isMainBranch) {
      // mainブランチはlane 0
      laneMap.set(commit.id, 0);
    } else {
      // それ以外はlane 1
      laneMap.set(commit.id, 1);
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
 * 親が存在しない場合（初回コミット）は線を作成しません。
 */
function generateConnections(nodes: CommitNode[]): CommitConnection[] {
  const connections: CommitConnection[] = [];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  for (const node of nodes) {
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
        // Phase 2.1: すべて通常の接続
        // Phase 2.2で異なるレーン間の接続を'merge'に分類予定
        type: 'normal',
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
