import type { HealthResponse } from '@git-canvas/shared';
import { useEffect, useState } from 'react';
import { HealthCheckEmpty } from './HealthCheckEmpty';
import { HealthCheckError } from './HealthCheckError';
import { HealthCheckLoading } from './HealthCheckLoading';
import { HealthCheckSuccess } from './HealthCheckSuccess';

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

  if (loading) return <HealthCheckLoading />;
  if (error) return <HealthCheckError error={error} />;
  if (!health) return <HealthCheckEmpty />;
  return <HealthCheckSuccess health={health} />;
};
