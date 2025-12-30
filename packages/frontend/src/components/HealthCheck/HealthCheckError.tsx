interface HealthCheckErrorProps {
  error: string;
}

export const HealthCheckError = ({ error }: HealthCheckErrorProps) => {
  return (
    <div style={{ padding: '20px', border: '2px solid #ef4444', borderRadius: '8px' }}>
      <h2>❌ Backend Error</h2>
      <p>Error: {error}</p>
      <p>
        Make sure backend is running: <code>pnpm dev:backend</code>
      </p>
    </div>
  );
};
