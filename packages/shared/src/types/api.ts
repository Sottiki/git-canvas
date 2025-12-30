/**
 * API レスポンスの共通型定義
 * Backend と Frontend で共有
 */

/**
 * ヘルスチェックのステータス型
 */
export type HealthStatus = 'ok' | 'error';

/**
 * ヘルスチェック API のレスポンス型
 */
export interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
}
