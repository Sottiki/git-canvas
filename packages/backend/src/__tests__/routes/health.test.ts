import type { Server } from 'node:http';
import type { HealthResponse } from '@git-canvas/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';

describe('Health Check API', () => {
  let server: Server;
  const PORT = 3001; // テスト用ポート (本番は 3000)

  beforeAll(() => {
    const app = createApp();
    server = app.listen(PORT);
  });

  afterAll(() => {
    server.close();
  });

  it('should return 200 status', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/health`);
    expect(response.status).toBe(200);
  });

  it('should return correct structure', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/health`);
    const data = (await response.json()) as HealthResponse;

    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('uptime');
  });

  it('should return status "ok"', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/health`);
    const data = (await response.json()) as HealthResponse;

    expect(data.status).toBe('ok');
  });

  it('should return valid timestamp', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/health`);
    const data = (await response.json()) as HealthResponse;

    const timestamp = new Date(data.timestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.getTime()).not.toBeNaN();
  });

  it('should return positive uptime', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/health`);
    const data = (await response.json()) as HealthResponse;

    expect(data.uptime).toBeGreaterThan(0);
    expect(typeof data.uptime).toBe('number');
  });
});
