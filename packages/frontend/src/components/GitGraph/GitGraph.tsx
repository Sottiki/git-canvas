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

  // 🔍 デバッグ: レイアウト情報をコンソールに出力
  console.log('=== GitGraph Debug ===');
  console.log('Total commits:', commits.length);
  console.log('Layout nodes:', layout.nodes.length);
  console.log('Layout lanes:', layout.lanes);
  console.log(
    'Nodes detail:',
    layout.nodes.map((n) => ({
      shortId: n.shortId,
      lane: n.lane,
      y: n.y,
      branchNames: n.branchNames,
    }))
  );
  console.log('=====================');

  const nodeRadius = 8;

  // アニメーション設定（Phase 1を踏襲）
  const lineDuration = 2.0;
  const nodeInterval = layout.nodes.length > 0 ? 2.0 / layout.nodes.length : 0;

  const id = useId();
  const gradientId = `lineGradient-${id}`;
  const nodeGradientId = `nodeGradient-${id}`;

  // SVGのサイズ（Phase 1の計算方法を維持）
  const svgWidth = layout.viewBox.width;
  const svgHeight = 300; // Phase 1の高さを維持

  // firstNode, lastNodeがnullの可能性を考慮
  const firstNode = layout.nodes.length > 0 ? layout.nodes[0] : null;
  const lastNode = layout.nodes.length > 0 ? layout.nodes[layout.nodes.length - 1] : null;

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

        {/* グラデーションライン */}
        {firstNode && lastNode && (
          <motion.line
            x1={firstNode.x}
            y1={firstNode.y - 1}
            x2={lastNode.x}
            y2={lastNode.y - 1.1}
            stroke={`url(#${gradientId})`}
            strokeWidth={6}
            strokeLinecap="round"
            opacity={0.6}
            {...{
              initial: { pathLength: 0, opacity: 0 },
              animate: { pathLength: 1, opacity: 0.6 },
              transition: {
                duration: lineDuration,
                ease: 'easeInOut',
                opacity: { duration: 0.3 },
              },
            }}
          />
        )}

        {/* コミットノード */}
        {layout.nodes.map((node, index) => {
          const nodeDelay = index * nodeInterval;

          return (
            <g key={node.id}>
              {/* ノードの影 */}
              <motion.circle
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
              />

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
