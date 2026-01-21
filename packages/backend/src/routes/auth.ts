import { type Request, type Response, Router } from 'express';

/**
 * セッションに保存するユーザー情報の型
 */
declare module 'express-session' {
  interface SessionData {
    accessToken?: string;
    user?: {
      id: number;
      login: string;
      name: string | null;
      avatarUrl: string;
    };
  }
}

/**
 * GitHub OAuth の設定
 */
const GITHUB_OAUTH_CONFIG = {
  clientId: process.env.GITHUB_CLIENT_ID ?? '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
  authorizeUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  userApiUrl: 'https://api.github.com/user',
  scope: 'read:user', // ユーザー情報の読み取りのみ
};

export const authRouter = Router();

/**
 * GET /api/auth/login
 * GitHubの認証ページにリダイレクト
 */
authRouter.get('/login', (_req: Request, res: Response): void => {
  const params = new URLSearchParams({
    client_id: GITHUB_OAUTH_CONFIG.clientId,
    scope: GITHUB_OAUTH_CONFIG.scope,
    redirect_uri: `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/api/auth/callback`,
  });

  const authUrl = `${GITHUB_OAUTH_CONFIG.authorizeUrl}?${params.toString()}`;
  res.redirect(authUrl);
});

/**
 * GET /api/auth/callback
 * GitHubからのコールバック処理
 */
authRouter.get('/callback', async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query;

  // codeがない場合はエラー
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Authorization code is required' });
    return;
  }

  try {
    // Step 1: codeをアクセストークンに交換
    const tokenResponse = await fetch(GITHUB_OAUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_OAUTH_CONFIG.clientId,
        client_secret: GITHUB_OAUTH_CONFIG.clientSecret,
        code,
      }),
    });

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (tokenData.error || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      res.status(400).json({
        error: 'Failed to exchange code for token',
        message: tokenData.error_description ?? tokenData.error,
      });
      return;
    }

    // Step 2: アクセストークンでユーザー情報を取得
    const userResponse = await fetch(GITHUB_OAUTH_CONFIG.userApiUrl, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!userResponse.ok) {
      res.status(500).json({ error: 'Failed to fetch user info' });
      return;
    }

    const userData = (await userResponse.json()) as {
      id: number;
      login: string;
      name: string | null;
      avatar_url: string;
    };

    // Step 3: セッションに保存
    req.session.accessToken = tokenData.access_token;
    req.session.user = {
      id: userData.id,
      login: userData.login,
      name: userData.name,
      avatarUrl: userData.avatar_url,
    };

    // Step 4: フロントエンドにリダイレクト
    res.redirect(process.env.FRONTEND_URL ?? 'http://localhost:5173');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

/**
 * GET /api/auth/logout
 * ログアウト（セッション破棄）
 */
authRouter.get('/logout', (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
      res.status(500).json({ error: 'Failed to logout' });
      return;
    }
    res.clearCookie('connect.sid'); // セッションCookieを削除
    res.json({ message: 'Logged out successfully' });
  });
});

/**
 * GET /api/auth/me
 * 現在のログイン状態を取得
 */
authRouter.get('/me', (req: Request, res: Response): void => {
  if (req.session.user) {
    res.json({
      authenticated: true,
      user: req.session.user,
    });
  } else {
    res.json({
      authenticated: false,
      user: null,
    });
  }
});
