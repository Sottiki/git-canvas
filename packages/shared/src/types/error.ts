/**
 * APIエラーレスポンス
 * 全てのAPIエンドポイントで共通して使用するエラー型
 */
export interface ErrorResponse {
  /** エラーの種類（簡潔な説明） */
  error: string;

  /** 詳細なエラーメッセージ */
  message: string;

  /** HTTPステータスコード */
  statusCode: number;
}
