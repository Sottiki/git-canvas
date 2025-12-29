/**
 * ヘルスチェックのステータス型
 * リテラル型により、'ok' と 'error' のみを許可
 */
export type HealthStatus = 'ok' | 'error';

/**
 * ヘルスチェックAPIのレスポンス型
 */
export interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
}
