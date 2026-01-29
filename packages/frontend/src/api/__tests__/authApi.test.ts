import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthStatusResponse } from '../authApi';
import { fetchAuthStatus, getLoginUrl, logout } from '../authApi';

// fetchをモック化
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('authApi', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchAuthStatus', () => {
    it('認証済みの場合、ユーザー情報を返す', async () => {
      // Arrange
      const mockResponse: AuthStatusResponse = {
        authenticated: true,
        user: {
          id: 123,
          login: 'testuser',
          name: 'Test User',
          avatarUrl: 'https://example.com/avatar.png',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await fetchAuthStatus();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/auth/me', {
        credentials: 'include',
      });
    });

    it('未認証の場合、authenticated: falseを返す', async () => {
      // Arrange
      const mockResponse: AuthStatusResponse = {
        authenticated: false,
        user: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await fetchAuthStatus();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.authenticated).toBe(false);
      expect(result.user).toBeNull();
    });

    it('APIエラーの場合、エラーを投げる', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      // Act & Assert
      await expect(fetchAuthStatus()).rejects.toThrow(
        'Failed to fetch auth status: Internal Server Error'
      );
    });
  });

  describe('logout', () => {
    it('正常にログアウトできる', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      // Act & Assert
      await expect(logout()).resolves.toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/auth/logout', {
        credentials: 'include',
      });
    });

    it('APIエラーの場合、エラーを投げる', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      // Act & Assert
      await expect(logout()).rejects.toThrow('Failed to logout: Unauthorized');
    });
  });

  describe('getLoginUrl', () => {
    it('ログインURLを返す', () => {
      // Act
      const url = getLoginUrl();

      // Assert
      expect(url).toBe('http://localhost:3000/api/auth/login');
    });
  });
});
