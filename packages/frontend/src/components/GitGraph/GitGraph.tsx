import type { CanvasCommit } from '@git-canvas/shared/types';
import { motion } from 'framer-motion';
import { useId } from 'react';
import styles from './GitGraph.module.css';

interface GitGraphProps {
  commits: CanvasCommit[];
}

export const GitGraph = ({ commits }: GitGraphProps) => {
  const nodeRadius = 8;
  const nodeSpacing = 80;
  const yPosition = 100;
  const startX = 50;

  const sortedCommits = [...commits].reverse();
  const svgWidth = sortedCommits.length * nodeSpacing + 100;

  const id = useId();
  const gradientId = `lineGradient-${id}`;
  const nodeGradientId = `nodeGradient-${id}`;

  return (
    <div className={styles.container}>
      <svg
        width={svgWidth}
        height="200"
        className={styles.svg}
        role="img"
        aria-label="Git commit graph"
      >
        <title>Git Commit Graph</title>

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
        <motion.line
          x1={startX - 20}
          y1={yPosition - 1}
          x2={svgWidth - 50}
          y2={yPosition - 1.1}
          stroke={`url(#${gradientId})`}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.6}
          {...{
            initial: { pathLength: 0, opacity: 0 },
            animate: { pathLength: 1, opacity: 0.6 },
            transition: {
              duration: 1.2,
              ease: 'easeInOut',
              opacity: { duration: 0.3 },
            },
          }}
        />

        {/* コミットノード */}
        {sortedCommits.map((commit, index) => {
          const cx = startX + index * nodeSpacing;
          const cy = yPosition;

          // ノードの登場タイミング（ラインより少し早め）
          const nodeDelay = index * 0.03;

          return (
            <g key={commit.id}>
              {/* ノードの影 */}
              <motion.circle
                cx={cx}
                cy={cy}
                r={nodeRadius + 3}
                fill="rgba(59, 130, 246, 0.15)"
                {...{
                  initial: { scale: 0, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                  transition: {
                    delay: nodeDelay,
                    duration: 0.4,
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                  },
                }}
              />

              {/* メインノード */}
              <motion.circle
                cx={cx}
                cy={cy}
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
                    duration: 0.4,
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                  },
                }}
              >
                <title>{commit.message}</title>
              </motion.circle>

              {/* 短縮SHA */}
              <motion.text
                x={cx}
                y={cy + 30}
                textAnchor="middle"
                fontSize={10}
                fill="#6b7280"
                fontFamily="'Fira Code', monospace"
                {...{
                  initial: { opacity: 1, y: 100 },
                  animate: { opacity: 1, y: 25 },
                  transition: {
                    delay: nodeDelay,
                    duration: 0.3,
                  },
                }}
              >
                {commit.shortId}
              </motion.text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
