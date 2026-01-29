import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthStatusResponse } from '../../api/authApi';
import * as authApi from '../../api/authApi';
import { useAuth } from '../useAuth';

// authApiモジュールをモック化
vi.mock('../../api/authApi', async () => {
  const actual = await vi.importActual('../../api/authApi');
  return {
    ...actual,
    fetchAuthStatus: vi.fn(),
    logout: vi.fn(),
  };
});

// window.location.hrefをモック化
const mockLocationHref = vi.fn();
const originalLocation = window.location;

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // window.locationをモック
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        set href(url: string) {
          mockLocationHref(url);
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    // window.locationを元に戻す
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('初期状態はloading: trueである', () => {
    // Arrange
    vi.mocked(authApi.fetchAuthStatus).mockImplementation(
      () => new Promise(() => {}) // 永遠にpending
    );

    // Act
    const { result } = renderHook(() => useAuth());

    // Assert
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('認証済みの場合、ユーザー情報を取得する', async () => {
    // Arrange
    const mockUser = {
      id: 123,
      login: 'testuser',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
    };
    const mockResponse: AuthStatusResponse = {
      authenticated: true,
      user: mockUser,
    };
    vi.mocked(authApi.fetchAuthStatus).mockResolvedValueOnce(mockResponse);

    // Act
    const { result } = renderHook(() => useAuth());

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('未認証の場合、user: nullになる', async () => {
    // Arrange
    const mockResponse: AuthStatusResponse = {
      authenticated: false,
      user: null,
    };
    vi.mocked(authApi.fetchAuthStatus).mockResolvedValueOnce(mockResponse);

    // Act
    const { result } = renderHook(() => useAuth());

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login()でログインURLにリダイレクトする', async () => {
    // Arrange
    const mockResponse: AuthStatusResponse = {
      authenticated: false,
      user: null,
    };
    vi.mocked(authApi.fetchAuthStatus).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    act(() => {
      result.current.login();
    });

    // Assert
    expect(mockLocationHref).toHaveBeenCalledWith('http://localhost:3000/api/auth/login');
  });

  it('logout()でユーザー情報がクリアされる', async () => {
    // Arrange
    const mockUser = {
      id: 123,
      login: 'testuser',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
    };
    vi.mocked(authApi.fetchAuthStatus).mockResolvedValueOnce({
      authenticated: true,
      user: mockUser,
    });
    vi.mocked(authApi.logout).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // Act
    await act(async () => {
      await result.current.logout();
    });

    // Assert
    expect(authApi.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('refetch()で認証状態を再取得できる', async () => {
    // Arrange: 最初は未認証
    vi.mocked(authApi.fetchAuthStatus).mockResolvedValueOnce({
      authenticated: false,
      user: null,
    });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(false);

    // Arrange: 次の呼び出しでは認証済み
    const mockUser = {
      id: 123,
      login: 'testuser',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
    };
    vi.mocked(authApi.fetchAuthStatus).mockResolvedValueOnce({
      authenticated: true,
      user: mockUser,
    });

    // Act
    await act(async () => {
      await result.current.refetch();
    });

    // Assert
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('fetchAuthStatusがエラーの場合、user: nullになる', async () => {
    // Arrange
    vi.mocked(authApi.fetchAuthStatus).mockRejectedValueOnce(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const { result } = renderHook(() => useAuth());

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch auth status:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});
