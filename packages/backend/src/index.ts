import dotenv from 'dotenv';

// 環境変数の読み込み(.envファイル)
dotenv.config();

import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 3000;
const app = createApp();

/**
 * サーバー起動
 * - 環境変数の読み込み
 * - アプリケーションの起動
 * - エラーハンドリング
 */
app.listen(PORT, (): void => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

/**
 * グローバルエラーハンドリング
 */
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>): void => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error): void => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
