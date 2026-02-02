/**
 * Git Graph レイアウト計算ロジック
 * Phase 2: 複数ブランチ対応
 *
 * このモジュールは、CanvasCommitの配列を受け取り、
 * SVG描画用の座標情報を計算してGitGraphLayoutを生成します。
 */

import type {
  BranchLane,
  CanvasBranch,
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
  config?: Partial<LayoutConfig>
): GitGraphLayout;

/**
 * コミット履歴からGitGraphのレイアウトを計算（ブランチ名表示対応）
 *
 * @param commits - コミットリスト（順不同でも可）
 * @param branches - ブランチリスト（レーン名表示用）
 * @param config - レイアウト設定（オプショナル）
 * @returns レイアウト計算済みのGitGraphLayout
 *
 * @example
 * ```typescript
 * const commits: CanvasCommit[] = [...];
 * const branches: CanvasBranch[] = [...];
 * const layout = calculateGitGraphLayout(commits, branches);
 * // layoutをGitGraphコンポーネントに渡す
 * ```
 */
export function calculateGitGraphLayout(
  commits: CanvasCommit[],
  branches: CanvasBranch[],
  config?: Partial<LayoutConfig>
): GitGraphLayout;

/**
 * 実装本体
 */
export function calculateGitGraphLayout(
  commits: CanvasCommit[],
  branchesOrConfig?: CanvasBranch[] | Partial<LayoutConfig>,
  config?: Partial<LayoutConfig>
): GitGraphLayout {
  // 引数の解釈：branchesOrConfigがCanvasBranch[]かPartial<LayoutConfig>かを判定
  let branches: CanvasBranch[] = [];
  let layoutConfig: LayoutConfig;

  if (Array.isArray(branchesOrConfig)) {
    // branchesOrConfigが配列 → CanvasBranch[]として扱う
    branches = branchesOrConfig;
    layoutConfig = {
      ...DEFAULT_LAYOUT_CONFIG,
      ...(config || {}),
    };
  } else {
    // branchesOrConfigがオブジェクト → Partial<LayoutConfig>として扱う（後方互換性）
    layoutConfig = {
      ...DEFAULT_LAYOUT_CONFIG,
      ...(branchesOrConfig || {}),
    };
  }

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

  // Step 6: レーンに代表ブランチ名を割り当て
  const lanesWithBranchNames = assignBranchNamesToLanes(lanes, nodes, branches);

  // Step 7: SVGビューボックスのサイズ計算
  const viewBox = calculateViewBox(nodes, layoutConfig);

  return {
    nodes,
    connections,
    lanes: lanesWithBranchNames,
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
    if (mergeCommit.parentIds.length < 2) continue;

    // 空いている最小の lane を取得
    const featureLane = availableLanes.shift() || ++maxLaneUsed;

    let currentId = mergeCommit.parentIds[1]; // feature側の親

    // 分岐点に到達するまで親を辿る
    let maxDepth = 100;
    while (currentId && maxDepth > 0) {
      maxDepth--;

      if (branchPoints.has(currentId)) {
        break;
      }

      if (!commitToLane.has(currentId)) {
        commitToLane.set(currentId, featureLane);
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
  }

  return commitToLane;
}

/**
 * 分岐〜マージ間のコミットに山の高さを計算
 *
 * lane 1以上（featureブランチ）を下に配置して山を作る
 */
function calculateMountainHeight(_commit: CanvasCommit, lane: number): number {
  // lane 1以上（feature）は下に配置
  if (lane >= 1) {
    return 40; // 下方向
  }

  // lane 0（main + merge）は通常位置
  return 0;
}

/**
 * 各コミットにレーン番号を割り当て
 *
 * アルゴリズム:
 * 1. マージコミット → lane 0
 * 2. マージ済み feature パス → findFeaturePaths で検出した lane
 * 3. 未マージ feature → 親のレーンを継承 or 分岐なら新しい lane
 * 4. main ブランチ → lane 0
 */
function assignLanes(commits: CanvasCommit[]): Map<string, number> {
  const laneMap = new Map<string, number>();

  // Step 1: 分岐点を検出
  const branchPoints = findBranchPoints(commits);

  // Step 2: マージ済み feature パスを検出
  const commitToLane = findFeaturePaths(commits, branchPoints);

  // Step 3: 各分岐点から最初に分岐した子を記録（分岐の検出用）
  const firstChildOfBranchPoint = new Map<string, string>();

  // Step 4: 現在使用中の最大レーン番号を追跡
  let maxLaneUsed = Math.max(0, ...commitToLane.values(), 0);

  // Step 5: レーン割り当て（時系列順に処理）
  for (const commit of commits) {
    // 5-1: マージコミットは常に lane 0
    const isMergeCommit = commit.parentIds.length >= 2;
    if (isMergeCommit) {
      laneMap.set(commit.id, 0);
      continue;
    }

    // 5-2: マージ済み feature パス上のコミット
    if (commitToLane.has(commit.id)) {
      const lane = commitToLane.get(commit.id)!;
      laneMap.set(commit.id, lane);
      continue;
    }

    // 5-3: 未マージ feature の処理
    const isNotInMain = !commit.branchNames.includes('main');
    if (isNotInMain) {
      const parentId = commit.parentIds[0];

      // 親が分岐点かどうかチェック
      if (parentId && branchPoints.has(parentId)) {
        const parentLane = laneMap.get(parentId);

        // 親が lane 0 (main) の場合
        if (parentLane === 0 || parentLane === undefined) {
          // この分岐点から最初に分岐した子かどうかチェック
          const firstChild = firstChildOfBranchPoint.get(parentId);

          if (firstChild === undefined) {
            // 最初の子 → 新しいレーンを割り当て
            maxLaneUsed++;
            laneMap.set(commit.id, maxLaneUsed);
            firstChildOfBranchPoint.set(parentId, commit.id);
          } else {
            // 2番目以降の子 → さらに新しいレーンを割り当て
            maxLaneUsed++;
            laneMap.set(commit.id, maxLaneUsed);
          }
        } else {
          // 親が lane 1以上（feature ブランチ）の場合
          const firstChild = firstChildOfBranchPoint.get(parentId);

          if (firstChild === undefined) {
            // 最初の子 → 親と同じレーンを継承（ブランチの継続）
            laneMap.set(commit.id, parentLane);
            firstChildOfBranchPoint.set(parentId, commit.id);
          } else {
            // 2番目以降の子 → 新しいレーンを割り当て（新しい分岐）
            maxLaneUsed++;
            laneMap.set(commit.id, maxLaneUsed);
          }
        }
      } else if (parentId && laneMap.has(parentId)) {
        const parentLane = laneMap.get(parentId)!;

        // 親が lane 0 (main) の場合、自分は main に含まれてないので別レーンにする
        if (parentLane === 0) {
          maxLaneUsed++;
          laneMap.set(commit.id, maxLaneUsed);
        } else {
          // 親が lane 1以上の場合 → 親と同じレーンを継承
          laneMap.set(commit.id, parentLane);
        }
      } else {
        // 親がまだ処理されていない or 親がいない → 新しいレーン
        maxLaneUsed++;
        laneMap.set(commit.id, maxLaneUsed);
      }
      continue;
    }

    // 5-4: main ブランチのコミット → lane 0
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
 * レーンに代表ブランチ名を割り当てる
 *
 * アルゴリズム:
 * - Lane 0 → "main" (固定)
 * - Lane 1+ → そのレーンの最新コミット（時系列で一番新しい）が属するブランチから選択
 *   - mainを除外
 *   - 残りから1つ選ぶ（アルファベット順で最初）
 *
 * @param lanes - ブランチレーン情報（branchName未設定）
 * @param nodes - コミットノード情報
 * @param branches - ブランチ一覧
 * @returns branchNameが設定されたブランチレーン情報
 */
function assignBranchNamesToLanes(
  lanes: BranchLane[],
  nodes: CommitNode[],
  branches: CanvasBranch[]
): BranchLane[] {
  // コミットID → ノードのマップを作成
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return lanes.map((lane) => {
    // Lane 0 は固定で "main"
    if (lane.laneNumber === 0) {
      return {
        ...lane,
        branchName: 'main',
      };
    }

    // Lane 1+ の場合、最新コミットを探す
    // 時系列で一番新しいコミット = commitIds配列の最後（時系列ソート済みのため）
    const latestCommitId = lane.commitIds[lane.commitIds.length - 1];
    const latestNode = nodeMap.get(latestCommitId);

    if (!latestNode) {
      // ノードが見つからない場合（エッジケース）
      return lane;
    }

    // 最新コミットが属するブランチ名から、mainを除外
    const candidateBranches = latestNode.branchNames.filter((name) => name !== 'main');

    // 候補がない場合
    if (candidateBranches.length === 0) {
      // branchesからこのレーンのコミットに一致するブランチを探す
      const matchingBranch = branches.find((branch) =>
        lane.commitIds.includes(branch.latestCommitId)
      );
      return {
        ...lane,
        branchName: matchingBranch?.name,
      };
    }

    // アルファベット順でソートして最初のブランチを選択
    const selectedBranch = candidateBranches.sort()[0];

    return {
      ...lane,
      branchName: selectedBranch,
    };
  });
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
