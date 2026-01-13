import type { CanvasCommit } from '@git-canvas/shared/types';
import { motion } from 'framer-motion';
import { useId } from 'react';
import { calculateGitGraphLayout } from '../../utils/gitGraph/layoutCalculator';
import styles from './GitGraph.module.css';

interface GitGraphProps {
  commits: CanvasCommit[];
}

export const GitGraph = ({ commits }: GitGraphProps) => {
  // Phase 2.1: レイアウト計算を layoutCalculator に移行
  const layout = calculateGitGraphLayout(commits, {
    nodeSpacing: 80,
    laneHeight: 60,
    startX: 50,
    startY: 200, // Phase 1のyPosition
    nodeRadius: 8,
  });

  const nodeRadius = 8;

  // アニメーション設定（Phase 1を踏襲）
  const nodeInterval = layout.nodes.length > 0 ? 2.0 / layout.nodes.length : 0;

  const id = useId();
  const gradientId = `lineGradient-${id}`;
  const nodeGradientId = `nodeGradient-${id}`;

  // SVGのサイズ（Phase 1の計算方法を維持）
  const svgWidth = layout.nodes.length > 0 ? layout.viewBox.width : 100;
  const svgHeight = 300; // Phase 1の高さを維持

  return (
    <div className={styles.container}>
      <svg
        width={svgWidth}
        height={svgHeight}
        className={styles.svg}
        role="img"
        aria-label="Git commit graph"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity={1} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
          </linearGradient>

          <linearGradient id={nodeGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
          </linearGradient>
        </defs>

        {/* コミット間の接続線 */}
        {layout.connections.map((connection, index) => {
          // Phase 1の対策: 同じY座標の場合、わずかにずらす
          const startY = connection.startY;
          const endY =
            connection.startY === connection.endY ? connection.endY - 0.1 : connection.endY;

          return (
            <motion.path
              key={`${connection.fromCommitId}-to-${connection.toCommitId}`}
              d={`M ${connection.startX} ${startY} L ${connection.endX} ${endY}`}
              stroke={`url(#${gradientId})`}
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
              {...{
                initial: { opacity: 0 },
                animate: { opacity: 0.8 },
                transition: {
                  delay: index * 0.05,
                  duration: 0.5,
                },
              }}
            />
          );
        })}

        {/* コミットノード */}
        {layout.nodes.map((node, index) => {
          const nodeDelay = index * nodeInterval;

          return (
            <g key={node.id}>
              {/* ノードの影 - 一時的に無効化 */}
              {/* <motion.circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius + 3}
                fill="rgba(59, 130, 246, 0.15)"
                {...{
                  initial: { scale: 0, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                  transition: {
                    delay: nodeDelay,
                    duration: 0.5,
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                  },
                }}
              /> */}

              {/* メインノード */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius}
                fill={`url(#${nodeGradientId})`}
                stroke="white"
                strokeWidth={2.5}
                className={styles.commitNode}
                {...{
                  initial: { scale: 0 },
                  animate: { scale: 1 },
                  whileHover: {
                    scale: 1.5,
                    filter: 'brightness(1.3) drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))',
                  },
                  transition: {
                    delay: nodeDelay,
                    duration: 0.5,
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                  },
                }}
              />

              {/* 短縮SHA */}
              <motion.text
                x={node.x}
                y={node.y + 30}
                textAnchor="middle"
                fontSize={10}
                fill="#6b7280"
                fontFamily="'Fira Code', monospace"
                {...{
                  initial: { opacity: 1, y: 100 },
                  animate: { opacity: 1, y: 25 },
                  transition: {
                    delay: nodeDelay,
                    duration: 0.4,
                  },
                }}
              >
                {node.shortId}
              </motion.text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
