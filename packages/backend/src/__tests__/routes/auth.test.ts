import express, { type Express } from 'express';
import session from 'express-session';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { authRouter } from '../../routes/auth.js';

describe('Auth Routes', () => {
  let app: Express;

  beforeAll(() => {
    // テスト用アプリケーション作成
    app = express();
    app.use(express.json());
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
      })
    );
    app.use('/api/auth', authRouter);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // 環境変数をモック
    process.env.GITHUB_CLIENT_ID = 'test-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
    process.env.FRONTEND_URL = 'http://localhost:5173';
  });

  describe('GET /api/auth/login', () => {
    it('GitHubの認証ページにリダイレクトする', async () => {
      const response = await request(app).get('/api/auth/login');

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('https://github.com/login/oauth/authorize');
      expect(response.headers.location).toContain('client_id=test-client-id');
      expect(response.headers.location).toContain('scope=read%3Auser');
    });
  });

  describe('GET /api/auth/callback', () => {
    it('codeがない場合は400エラーを返す', async () => {
      const response = await request(app).get('/api/auth/callback');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Authorization code is required');
    });
  });

  describe('GET /api/auth/me', () => {
    it('未ログイン時は authenticated: false を返す', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        authenticated: false,
        user: null,
      });
    });
  });

  describe('GET /api/auth/logout', () => {
    it('ログアウト成功メッセージを返す', async () => {
      const response = await request(app).get('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });
});
