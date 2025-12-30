import type { HealthResponse } from '@git-canvas/shared';
import { type Request, type Response, Router } from 'express';

export const healthRouter = Router();

/**
 * ヘルスチェックハンドラ
 * - サーバーの稼働状態を返す
 *
 * @param _req - リクエストオブジェクト(未使用)
 * @param res - レスポンスオブジェクト
 * @returns void
 */
const getHealthStatus = (_req: Request, res: Response<HealthResponse>): void => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

/**
 * ルーター設定
 *
 * エンドポイント: GET /api/health
 */
healthRouter.get('/', getHealthStatus);
