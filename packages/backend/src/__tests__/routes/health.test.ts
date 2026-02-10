import type { HealthResponse } from '@git-canvas/shared';
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { healthRouter } from '../../routes/health.js';

describe('Health Check API', () => {
  // テスト用のExpressアプリを作成（サーバーを起動しない）
  const app = express();
  app.use('/api/health', healthRouter);

  it('should return 200 status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
  });

  it('should return correct structure', async () => {
    const response = await request(app).get('/api/health');
    const data = response.body as HealthResponse;

    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('uptime');
  });

  it('should return status "ok"', async () => {
    const response = await request(app).get('/api/health');
    const data = response.body as HealthResponse;

    expect(data.status).toBe('ok');
  });

  it('should return valid timestamp', async () => {
    const response = await request(app).get('/api/health');
    const data = response.body as HealthResponse;

    const timestamp = new Date(data.timestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.getTime()).not.toBeNaN();
  });

  it('should return positive uptime', async () => {
    const response = await request(app).get('/api/health');
    const data = response.body as HealthResponse;

    expect(data.uptime).toBeGreaterThan(0);
    expect(typeof data.uptime).toBe('number');
  });
});
