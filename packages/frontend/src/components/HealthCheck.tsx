import { type JSX, useEffect, useState } from 'react';

interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
}

export const HealthCheck = (): JSX.Element => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async (): Promise<void> => {
      try {
        const response = await fetch('http://localhost:3000/api/health');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: HealthResponse = await response.json();
        setHealth(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', border: '2px solid #3b82f6', borderRadius: '8px' }}>
        <h2>⏳ Checking Backend...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', border: '2px solid #ef4444', borderRadius: '8px' }}>
        <h2>❌ Backend Error</h2>
        <p>Error: {error}</p>
        <p>
          Make sure backend is running: <code>pnpm dev:backend</code>
        </p>
      </div>
    );
  }

  if (!health) {
    return (
      <div style={{ padding: '20px', border: '2px solid #6b7280', borderRadius: '8px' }}>
        <h2>❓ No Data</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '2px solid #10b981', borderRadius: '8px' }}>
      <h2>✅ Backend Health Check</h2>
      <p>
        <strong>Status:</strong> {health.status}
      </p>
      <p>
        <strong>Timestamp:</strong> {new Date(health.timestamp).toLocaleString()}
      </p>
      <p>
        <strong>Uptime:</strong> {health.uptime.toFixed(2)} seconds
      </p>
    </div>
  );
};
