import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthCheck } from '../HealthCheck';

describe('HealthCheck', () => {
  beforeEach(() => {
    // fetch のモックをリセット
    vi.restoreAllMocks();
  });

  it('should show loading state initially', () => {
    // fetch をモックして pending 状態に
    global.fetch = vi.fn(() => new Promise(() => {})) as typeof fetch;

    render(<HealthCheck />);

    expect(screen.getByText(/Checking Backend/i)).toBeInTheDocument();
  });

  it('should show success state when API returns ok', async () => {
    // fetch をモック (成功)
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: 123.45,
          }),
      } as Response)
    );

    render(<HealthCheck />);

    // 非同期で success 状態を待つ
    await waitFor(() => {
      expect(screen.getByText(/Backend Health Check/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Status:/i)).toBeInTheDocument();
    expect(screen.getByText(/ok/i)).toBeInTheDocument();
    expect(screen.getByText(/123.45 seconds/i)).toBeInTheDocument();
  });

  it('should show error state when API fails', async () => {
    // fetch をモック (失敗)
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    render(<HealthCheck />);

    // 非同期で error 状態を待つ
    await waitFor(() => {
      expect(screen.getByText(/Backend Error/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
  });

  it('should show error state when response is not ok', async () => {
    // fetch をモック (HTTP エラー)
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      } as Response)
    );

    render(<HealthCheck />);

    await waitFor(() => {
      expect(screen.getByText(/Backend Error/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/HTTP error! status: 500/i)).toBeInTheDocument();
  });

  it('should show No Data when API returns empty', async () => {
    // fetch をモック (成功だけどデータなし)
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'ok',
          }),
      } as Response)
    );

    render(<HealthCheck />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('❓ No Data');
    });
  });
});
