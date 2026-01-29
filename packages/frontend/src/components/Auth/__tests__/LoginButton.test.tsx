import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as useAuthModule from '../../../hooks/useAuth';
import { LoginButton } from '../LoginButton';

// useAuthフックをモック化
vi.mock('../../../hooks/useAuth');

describe('LoginButton', () => {
  const mockLogin = vi.fn();
  const mockLogout = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング中は「Loading...」を表示する', () => {
    // Arrange
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      loading: true,
      isAuthenticated: false,
      login: mockLogin,
      logout: mockLogout,
      refetch: mockRefetch,
    });

    // Act
    render(<LoginButton />);

    // Assert
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('未ログイン時は「GitHubでログイン」ボタンを表示する', () => {
    // Arrange
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
      login: mockLogin,
      logout: mockLogout,
      refetch: mockRefetch,
    });

    // Act
    render(<LoginButton />);

    // Assert
    expect(screen.getByRole('button', { name: /GitHubでログイン/i })).toBeInTheDocument();
  });

  it('未ログイン時にボタンをクリックするとlogin()が呼ばれる', async () => {
    // Arrange
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
      login: mockLogin,
      logout: mockLogout,
      refetch: mockRefetch,
    });
    const user = userEvent.setup();

    // Act
    render(<LoginButton />);
    await user.click(screen.getByRole('button', { name: /GitHubでログイン/i }));

    // Assert
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it('ログイン済みはユーザー名とアバターを表示する', () => {
    // Arrange
    const mockUser = {
      id: 123,
      login: 'testuser',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
    };
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      login: mockLogin,
      logout: mockLogout,
      refetch: mockRefetch,
    });

    // Act
    render(<LoginButton />);

    // Assert
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'testuser' })).toHaveAttribute(
      'src',
      'https://example.com/avatar.png'
    );
  });

  it('ログイン済みは「ログアウト」ボタンを表示する', () => {
    // Arrange
    const mockUser = {
      id: 123,
      login: 'testuser',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
    };
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      login: mockLogin,
      logout: mockLogout,
      refetch: mockRefetch,
    });

    // Act
    render(<LoginButton />);

    // Assert
    expect(screen.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument();
  });

  it('ログイン済みにログアウトボタンをクリックするとlogout()が呼ばれる', async () => {
    // Arrange
    const mockUser = {
      id: 123,
      login: 'testuser',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
    };
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      login: mockLogin,
      logout: mockLogout,
      refetch: mockRefetch,
    });
    const user = userEvent.setup();

    // Act
    render(<LoginButton />);
    await user.click(screen.getByRole('button', { name: 'ログアウト' }));

    // Assert
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
