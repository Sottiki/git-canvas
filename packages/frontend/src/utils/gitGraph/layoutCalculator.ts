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
 * 分岐点を検出
 *
 * 子コミットが2つ以上あるコミットを分岐点とする
 */
function findBranchPoints(commits: CanvasCommit[]): Set<string> {
  const branchPoints = new Set<string>();

  for (const commit of commits) {
    // このコミットを親として持つ子コミットを数える
    const children = commits.filter((c) => c.parentIds.includes(commit.id));

    if (children.length >= 2) {
      branchPoints.add(commit.id);
      console.log(`Branch point found: ${commit.shortId} (${children.length} children)`);
    }
  }

  return branchPoints;
}

/**
 * マージコミットから分岐点までのfeatureパスを検出
 *
 * 時系列順に処理し、マージ済みの lane を再利用する
 */
function findFeaturePaths(commits: CanvasCommit[], branchPoints: Set<string>): Map<string, number> {
  const commitToLane = new Map<string, number>();
  const commitMap = new Map(commits.map((c) => [c.id, c]));

  // マージコミットを時系列順に処理
  const mergeCommits = commits
    .filter((c) => c.parentIds.length >= 2)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 利用可能なlane番号を管理（lane 0 は main 専用）
  const availableLanes = [1]; // 最初は lane 1 が利用可能
  let maxLaneUsed = 1;

  for (const mergeCommit of mergeCommits) {
    console.log(`Processing merge commit: ${mergeCommit.shortId} at ${mergeCommit.date}`);

    if (mergeCommit.parentIds.length < 2) continue;

    // 空いている最小の lane を取得
    const featureLane = availableLanes.shift() || ++maxLaneUsed;
    console.log(`Assigning lane ${featureLane} to this feature branch`);

    let currentId = mergeCommit.parentIds[1]; // feature側の親
    const pathCommits: string[] = [];

    // 分岐点に到達するまで親を辿る
    let maxDepth = 100;
    while (currentId && maxDepth > 0) {
      maxDepth--;

      if (branchPoints.has(currentId)) {
        console.log(`Reached branch point: ${commitMap.get(currentId)?.shortId}`);
        break;
      }

      if (!commitToLane.has(currentId)) {
        commitToLane.set(currentId, featureLane);
        pathCommits.push(currentId);
        console.log(
          `Added to feature path: ${commitMap.get(currentId)?.shortId} → lane ${featureLane}`
        );
      }

      const current = commitMap.get(currentId);
      if (!current || current.parentIds.length === 0) {
        break;
      }

      currentId = current.parentIds[0];
    }

    // このマージが完了したら lane を再利用可能にする
    availableLanes.push(featureLane);
    availableLanes.sort((a, b) => a - b); // 小さい順に並べる
    console.log(`Lane ${featureLane} is now available for reuse`);
  }

  return commitToLane;
}

/**
 * 分岐〜マージ間のコミットに山の高さを計算
 *
 * lane 1以上（featureブランチ）を下に配置して山を作る
 */
function calculateMountainHeight(commit: CanvasCommit, lane: number): number {
  // lane 1以上（feature）は下に配置
  if (lane >= 1) {
    console.log(`Mountain height for ${commit.shortId} (lane ${lane}): +40px`);
    return 40; // 下方向
  }

  // lane 0（main + merge）は通常位置
  return 0;
}

/**
 * 各コミットにレーン番号を割り当て
 *
 * 1. マージ済み feature: 時系列で lane を再利用
 * 2. 未マージ feature: main に含まれないコミットを検出して新しい lane を割り当て
 */
function assignLanes(commits: CanvasCommit[]): Map<string, number> {
  const laneMap = new Map<string, number>();

  // Step 1: 分岐点を検出
  const branchPoints = findBranchPoints(commits);

  // Step 2: マージ済み feature パスを検出
  const commitToLane = findFeaturePaths(commits, branchPoints);

  // Step 3: レーン割り当て
  for (const commit of commits) {
    // マージコミットは常に lane 0
    const isMergeCommit = commit.parentIds.length >= 2;
    if (isMergeCommit) {
      console.log(`Merge commit ${commit.shortId} → lane 0`);
      laneMap.set(commit.id, 0);
      continue;
    }

    // マージ済み feature パス上のコミット
    if (commitToLane.has(commit.id)) {
      const lane = commitToLane.get(commit.id)!;
      console.log(`Merged feature commit ${commit.shortId} → lane ${lane}`);
      laneMap.set(commit.id, lane);
      continue;
    }

    // 未マージ feature: main ブランチに含まれない
    const isNotInMain = !commit.branchNames.includes('main');
    if (isNotInMain) {
      // 利用可能な最大の lane + 1 を割り当て
      const maxLane = Math.max(0, ...commitToLane.values());
      const newLane = maxLane + 1;
      console.log(
        `Unmerged feature commit ${commit.shortId} (${commit.branchNames.join(',')}) → lane ${newLane}`
      );
      laneMap.set(commit.id, newLane);
      continue;
    }

    // main ブランチのコミット → lane 0
    laneMap.set(commit.id, 0);
  }

  return laneMap;
}

/**
 * ノードの座標を計算
 *
 * X座標: コミットのインデックス × nodeSpacing + startX
 * Y座標: レーン番号 × laneHeight + startY + 山の高さ
 */
function calculateNodePositions(
  commits: CanvasCommit[],
  laneAssignments: Map<string, number>,
  config: LayoutConfig
): CommitNode[] {
  return commits.map((commit, index) => {
    const lane = laneAssignments.get(commit.id) ?? 0;
    const x = index * config.nodeSpacing + config.startX;
    const baseY = lane * config.laneHeight + config.startY;

    // 山の高さを追加（featureブランチは下に広がる）
    const mountainHeight = calculateMountainHeight(commit, lane);
    const y = baseY + mountainHeight;

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
