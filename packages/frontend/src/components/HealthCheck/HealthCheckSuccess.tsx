import type { HealthResponse } from '@git-canvas/shared';

interface HealthCheckSuccessProps {
  health: HealthResponse;
}

export const HealthCheckSuccess = ({ health }: HealthCheckSuccessProps) => {
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
