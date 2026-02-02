/**
 * Git Graph 可視化のための型定義
 *
 * このファイルは、Gitコミット履歴をSVGグラフとして描画するための
 * レイアウト計算に必要な型を定義します。
 */

import type { CanvasCommit } from './canvas.js';

/**
 * レイアウト計算後のコミットノード情報
 *
 * CanvasCommitにSVG描画用の座標情報を追加した型。
 * レイアウト計算アルゴリズムの出力として生成されます。
 */
export interface CommitNode extends CanvasCommit {
  /** SVG上のX座標（ピクセル単位） */
  x: number;

  /** SVG上のY座標（ピクセル単位） */
  y: number;

  /** ブランチレーン番号（0から開始、0=mainブランチ） */
  lane: number;
}

/**
 * ブランチレーン情報
 *
 * 各ブランチが占めるY座標の範囲（レーン）を管理します。
 * mainブランチはlane 0、featureブランチはlane 1以降に配置されます。
 */
export interface BranchLane {
  /** レーン番号（0がmainブランチ、1以降がfeatureブランチ） */
  laneNumber: number;

  /** このレーンに属するコミットIDリスト */
  commitIds: string[];

  /** このレーンの代表ブランチ名（左袖固定表示用） */
  branchName?: string;

  /** レーンの色（オプショナル、未指定時はデフォルトグラデーション） */
  color?: string;
}

/**
 * コミット間の接続線情報
 *
 * 親コミットへの接続を表現します。
 * 通常の接続（同一ブランチ）とマージ接続（異なるブランチ）を区別します。
 */
export interface CommitConnection {
  /** 接続元のコミットID */
  fromCommitId: string;

  /** 接続先（親）のコミットID */
  toCommitId: string;

  /** 開始座標（接続元コミットの中心） */
  startX: number;
  startY: number;

  /** 終了座標（接続先コミットの中心） */
  endX: number;
  endY: number;

  /** 接続の種類（通常の接続 or マージ接続） */
  type: 'normal' | 'merge';
}

/**
 * レイアウト計算の設定パラメータ
 *
 * SVGグラフのレイアウトを制御するための設定値。
 * デフォルト値はPhase 1の実装値を踏襲しています。
 */
export interface LayoutConfig {
  /** ノード間の水平距離（デフォルト: 80px） */
  nodeSpacing: number;

  /** レーン間の垂直距離（デフォルト: 60px） */
  laneHeight: number;

  /** SVG描画領域の開始X座標（デフォルト: 50px） */
  startX: number;

  /** SVG描画領域の開始Y座標（デフォルト: 30px） */
  startY: number;

  /** コミットノードの半径（デフォルト: 8px） */
  nodeRadius: number;
}

/**
 * レイアウト計算の結果
 *
 * GitGraphコンポーネントに渡される最終的なデータ構造。
 * このオブジェクトには、SVGグラフを描画するために必要な
 * すべての情報が含まれています。
 */
export interface GitGraphLayout {
  /** レイアウト計算済みのコミットノードリスト */
  nodes: CommitNode[];

  /** コミット間の接続線リスト */
  connections: CommitConnection[];

  /** ブランチレーン情報のリスト */
  lanes: BranchLane[];

  /** SVG全体のビューボックスサイズ */
  viewBox: {
    /** SVGの幅（ピクセル） */
    width: number;
    /** SVGの高さ（ピクセル） */
    height: number;
  };
}
