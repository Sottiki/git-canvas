import cors from 'cors';
import express, { type Express } from 'express';
import session from 'express-session';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { createRepositoryRouter } from './routes/repository.js';

/**
 * 許可するオリジンのリストを取得
 * 環境変数 FRONTEND_URL が設定されている場合はそれを使用
 * 設定されていない場合は開発用のデフォルト値を使用
 */
const getAllowedOrigins = (): string[] => {
  const envOrigin = process.env.FRONTEND_URL;

  if (envOrigin) {
    // 本番環境: 環境変数で指定されたオリジンのみ
    return [envOrigin];
  }

  // 開発環境: Vite dev server と preview server の両方を許可
  return ['http://localhost:5173', 'http://localhost:4173'];
};

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
  app.use(
    cors({
      origin: getAllowedOrigins(),
      credentials: true, // Cookie送信を許可
    })
  );

  // セッション設定
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'dev-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true, // JavaScriptからアクセス不可（XSS対策）
        secure: process.env.NODE_ENV === 'production', // 本番はHTTPSのみ
        sameSite: 'lax', // CSRF対策
        maxAge: 24 * 60 * 60 * 1000, // 24時間
      },
    })
  );

  // JSONリクエストボディのパース
  app.use(express.json());

  // URLエンコードされたリクエストボディのパース
  app.use(express.urlencoded({ extended: true }));

  // ルーター設定
  app.use('/api/auth', authRouter);
  app.use('/api/health', healthRouter);
  app.use('/api/repositories', createRepositoryRouter());

  return app;
};
