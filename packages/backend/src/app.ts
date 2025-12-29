import express, { Express } from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';

/**
 * Expressアプリケーションの作成と設定
 * - ミドルウェアの設定
 * - ルーターの登録
 * - アプリケーションインスタンスの返却
 * 
 * @returns Express アプリケーションインスタンス
 */
export const createApp = (): Express => {
  const app = express();

  // CORS設定: フロントエンドからのリクエストを許可
  app.use(cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  }));

  // JSONリクエストボディのパース
  app.use(express.json());
  
  // URLエンコードされたリクエストボディのパース
  app.use(express.urlencoded({ extended: true }));

  // ルーター設定
  app.use('/api/health', healthRouter);

  return app;
};
